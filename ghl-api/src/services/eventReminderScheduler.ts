/**
 * Event Reminder Scheduler
 * Runs hourly and sends push notifications for events starting in ~24 hours.
 *
 * Strategy: send a reminder for any event whose startTime falls in the window
 *   [now + 23h, now + 25h]
 * This gives a ±1h tolerance around the 24-hour mark and naturally prevents
 * duplicates because the window only overlaps one hourly run.
 *
 * On server restart the in-memory dedup set is cleared. The worst-case outcome
 * is one extra reminder per event if a restart happens during the 2-hour window —
 * acceptable for this use case.
 */

import cron from 'node-cron';
import { ghlService } from '@/services/gohighlevel';
import { sendToAll } from '@/services/notificationService';
import { prisma } from '@/lib/prisma';

// Track event IDs we've already reminded about this server session
const remindedEventIds = new Set<string>();

const DEFAULT_REMINDER_HOURS = 24; // fallback if no DB setting exists
const WINDOW_HOURS = 1;            // ±hours tolerance window

async function getReminderHours(): Promise<number> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: 'eventReminderHours' } });
    if (row) {
      const parsed = parseInt(row.value, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 168) return parsed;
    }
  } catch {
    // DB unavailable — use default
  }
  return DEFAULT_REMINDER_HOURS;
}

/**
 * Check for upcoming events and send reminders where needed.
 * Safe to call manually for testing.
 */
export async function checkAndSendEventReminders(): Promise<void> {
  // Skip silently if FCM is not configured
  const { FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY } = process.env;
  if (!FCM_PROJECT_ID || !FCM_CLIENT_EMAIL || !FCM_PRIVATE_KEY) return;

  const reminderHours = await getReminderHours();

  const now = new Date();
  const windowStart = new Date(now.getTime() + (reminderHours - WINDOW_HOURS) * 60 * 60 * 1000);
  const windowEnd   = new Date(now.getTime() + (reminderHours + WINDOW_HOURS) * 60 * 60 * 1000);

  let events: any[] = [];
  try {
    events = await ghlService.getCalendarEvents(null as any, windowStart, windowEnd);
  } catch (err) {
    console.error('[EventReminder] Failed to fetch calendar events:', err);
    return;
  }

  for (const event of events) {
    const eventId: string = event.id;
    if (!eventId || remindedEventIds.has(eventId)) continue;

    // Verify the start time is actually within our window
    const startTime = new Date(event.startTime || event.start);
    if (isNaN(startTime.getTime())) continue;
    if (startTime < windowStart || startTime > windowEnd) continue;

    // Format the time for the notification body
    const timeStr = startTime.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    });

    const title = event.title || 'Upcoming Chamber Event';
    const body  = `Reminder: "${title}" starts tomorrow at ${timeStr}`;
    const link  = `/calendar`;

    try {
      const result = await sendToAll({ title: 'Event Reminder', body, link });
      remindedEventIds.add(eventId);
      console.log(`[EventReminder] Sent reminder for "${title}" → ${result.sent} devices`);
    } catch (err) {
      console.error(`[EventReminder] Failed to send reminder for event ${eventId}:`, err);
    }
  }
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
