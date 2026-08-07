/**
 * Event Reminder Scheduler
 * Runs hourly and sends push notifications for upcoming events.
 *
 * Supports two configurable reminder windows (first & second reminder).
 * Dedup is persisted in the DB (event_reminder_logs table) so reminders
 * survive server restarts and are never sent twice per event per slot.
 */

import cron from 'node-cron';
import { ghlService } from '@/services/gohighlevel';
import { sendToAll } from '@/services/notificationService';
import { prisma } from '@/lib/prisma';

const DEFAULT_REMINDER_1_HOURS = 168; // first reminder: 7 days out
const DEFAULT_REMINDER_2_HOURS = 24;  // second reminder: 1 day out
const WINDOW_HOURS = 1;               // ±hours tolerance window

async function getReminderHoursSetting(key: string, defaultVal: number): Promise<number> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    if (row) {
      const parsed = parseInt(row.value, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 720) return parsed;
    }
  } catch {
    // DB unavailable — use default
  }
  return defaultVal;
}

function formatReminderBody(title: string, reminderHours: number, timeStr: string): string {
  if (reminderHours >= 648) {
    return `Heads up: "${title}" is coming up in about a month (${timeStr})`;
  } else if (reminderHours >= 144) {
    return `Reminder: "${title}" is coming up next week (${timeStr})`;
  } else if (reminderHours >= 48) {
    const days = Math.round(reminderHours / 24);
    return `Reminder: "${title}" is in ${days} days (${timeStr})`;
  } else if (reminderHours >= 20) {
    return `Reminder: "${title}" is tomorrow at ${timeStr}`;
  } else {
    return `Reminder: "${title}" starts at ${timeStr}`;
  }
}

/** Returns true if this event+slot combination has already been sent. */
async function alreadySent(eventId: string, slot: string): Promise<boolean> {
  try {
    const existing = await prisma.eventReminderLog.findUnique({
      where: { eventId_slot: { eventId, slot } },
    });
    return !!existing;
  } catch {
    return false; // DB error — allow send rather than suppressing
  }
}

/** Record that a reminder was sent for this event+slot. */
async function markSent(eventId: string, slot: string): Promise<void> {
  try {
    await prisma.eventReminderLog.upsert({
      where: { eventId_slot: { eventId, slot } },
      create: { eventId, slot },
      update: { sentAt: new Date() },
    });
  } catch (err) {
    console.error('[EventReminder] Failed to write reminder log:', err);
  }
}

async function sendReminderForWindow(
  reminderHours: number,
  slot: '1' | '2',
  calendarId: string,
  testMode = false
): Promise<number> {
  const now = new Date();
  // Production: narrow ±1h window around the exact reminder time
  // Test mode: full window from now → reminderHours out
  const windowStart = testMode
    ? now
    : new Date(now.getTime() + (reminderHours - WINDOW_HOURS) * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + (reminderHours + WINDOW_HOURS) * 60 * 60 * 1000);

  let events: any[] = [];
  try {
    events = await ghlService.getCalendarEvents(calendarId, windowStart, windowEnd);
  } catch (err) {
    console.error(`[EventReminder] Failed to fetch calendar events (slot ${slot}):`, err);
    return 0;
  }

  let sent = 0;
  for (const event of events) {
    const eventId: string = event.id;
    if (!eventId) continue;

    // Skip events flagged to exclude from reminders
    try {
      const flag = await prisma.eventFlag.findUnique({ where: { eventId } });
      if (flag?.excludeFromReminders) {
        console.log(`[EventReminder] Slot ${slot}: skipping event ${eventId} (excludeFromReminders)`);
        continue;
      }
    } catch {
      // DB error — allow send rather than suppressing
    }

    // Check persistent DB dedup — skip if already sent
    if (await alreadySent(eventId, slot)) {
      console.log(`[EventReminder] Slot ${slot}: already sent for event ${eventId}, skipping`);
      continue;
    }

    const startTime = new Date(event.startTime || event.start);
    if (isNaN(startTime.getTime())) continue;
    if (startTime < windowStart || startTime > windowEnd) continue;

    const timeStr = startTime.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Denver',
    });

    const title = event.title || 'Upcoming Chamber Event';
    const body  = formatReminderBody(title, reminderHours, timeStr);
    const link  = `/calendar?event=${eventId}`;

    try {
      const result = await sendToAll({ title: 'Event Reminder', body, link });
      await markSent(eventId, slot);
      sent += result.sent;
      console.log(`[EventReminder] Slot ${slot} (${reminderHours}h): sent reminder for "${title}" → ${result.sent} devices`);
    } catch (err) {
      console.error(`[EventReminder] Slot ${slot}: Failed to send reminder for event ${eventId}:`, err);
    }
  }
  return sent;
}

async function runReminders(testMode: boolean): Promise<{ eventsFound: boolean; totalSent: number }> {
  const { FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY } = process.env;
  if (!FCM_PROJECT_ID || !FCM_CLIENT_EMAIL || !FCM_PRIVATE_KEY) {
    return { eventsFound: false, totalSent: 0 };
  }

  const calendarId = process.env.CALENDAR_ID;
  if (!calendarId) {
    console.error('[EventReminder] CALENDAR_ID env var is not set');
    return { eventsFound: false, totalSent: 0 };
  }

  const [hours1, hours2] = await Promise.all([
    getReminderHoursSetting('eventReminderHours', DEFAULT_REMINDER_1_HOURS),
    getReminderHoursSetting('eventReminderHours2', DEFAULT_REMINDER_2_HOURS),
  ]);

  const [sent1, sent2] = await Promise.all([
    sendReminderForWindow(hours1, '1', calendarId, testMode),
    sendReminderForWindow(hours2, '2', calendarId, testMode),
  ]);

  const totalSent = sent1 + sent2;
  return { eventsFound: totalSent > 0, totalSent };
}

/**
 * Production: checks the narrow ±1h window. Called by the hourly cron.
 */
export async function checkAndSendEventReminders(): Promise<{ eventsFound: boolean; totalSent: number }> {
  return runReminders(false);
}

/**
 * Test mode: scans the full window (now → reminderHours out) to find any upcoming event.
 * Still uses DB dedup — clear event_reminder_logs rows to re-test the same events.
 */
export async function testEventReminders(): Promise<{ eventsFound: boolean; totalSent: number }> {
  return runReminders(true);
}

/**
 * Start the hourly cron job.
 * Call once from server startup.
 */
export function startEventReminderScheduler(): void {
  // Run at the top of every hour
  cron.schedule('0 * * * *', () => {
    checkAndSendEventReminders().catch((err) =>
      console.error('[EventReminder] Unexpected error:', err)
    );
  });

  console.log('[EventReminder] Scheduler started — runs hourly');
}
