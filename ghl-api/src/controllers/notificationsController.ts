/**
 * Notifications Controller
 * Handles device token registration and admin-initiated push notification sends.
 */

import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { sendToAll, sendToUsers } from '@/services/notificationService';
import { checkAndSendEventReminders, testEventReminders } from '@/services/eventReminderScheduler';

class NotificationsController {
  /**
   * POST /api/notifications/register
   * Register (or refresh) the calling user's device token.
   * Authenticated — any member.
   */
  async registerToken(req: Request, res: Response) {
    const userId = Number(req.user!.id);
    const { token, platform } = req.body as { token?: string; platform?: string };

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({ error: 'token is required' });
    }

    const allowed = ['ios', 'android', 'web'];
    if (!platform || !allowed.includes(platform)) {
      return res.status(400).json({ error: `platform must be one of: ${allowed.join(', ')}` });
    }

    // Upsert: if this exact token already exists update userId/platform in case of
    // re-install on a different account; otherwise create a new row.
    await prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });

    return res.status(200).json({ ok: true });
  }

  /**
   * DELETE /api/notifications/register
   * Unregister the calling user's device token (on logout / opt-out).
   * Authenticated — any member.
   */
  async unregisterToken(req: Request, res: Response) {
    const userId = Number(req.user!.id);
    const { token } = req.body as { token?: string };

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'token is required' });
    }

    await prisma.deviceToken.deleteMany({ where: { userId, token } });

    return res.status(200).json({ ok: true });
  }

  /**
   * POST /api/notifications/send
   * Admin: send a push notification to all members or a specific subset.
   * Body: { title, body, link?, userIds? }
   *   - If userIds is omitted → broadcast to everyone.
   *   - If userIds is an array → send only to those user IDs.
   */
  async sendNotification(req: Request, res: Response) {
    const { title, body, link, userIds, emails } = req.body as {
      title?: string;
      body?: string;
      link?: string;
      userIds?: number[];
      emails?: string[];
    };

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!body || typeof body !== 'string' || body.trim() === '') {
      return res.status(400).json({ error: 'body is required' });
    }

    try {
      let resolvedUserIds: number[] | undefined;

      // Resolve emails → userIds if emails were provided instead
      if (Array.isArray(emails) && emails.length > 0) {
        const users = await prisma.user.findMany({
          where: { email: { in: emails.map(e => e.toLowerCase()) } },
          select: { id: true },
        });
        resolvedUserIds = users.map(u => u.id);
      } else if (Array.isArray(userIds) && userIds.length > 0) {
        resolvedUserIds = userIds;
      }

      let result: { sent: number; failed: number };

      if (resolvedUserIds && resolvedUserIds.length > 0) {
        result = await sendToUsers(resolvedUserIds, { title, body, link });
      } else {
        result = await sendToAll({ title, body, link });
      }

      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[NotificationsController] sendNotification error:', err);
      if (err.message?.includes('credentials not configured')) {
        return res.status(503).json({ error: 'Push notifications not configured on this server.' });
      }
      return res.status(500).json({ error: 'Failed to send notification' });
    }
  }

  /**
   * GET /api/notifications/settings
   * Returns current notification settings (admin only).
   */
  async getSettings(_req: Request, res: Response) {
    const [row1, row2] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: 'eventReminderHours' } }),
      prisma.appSetting.findUnique({ where: { key: 'eventReminderHours2' } }),
    ]);
    const reminderHours  = row1 ? parseInt(row1.value, 10) : 168;
    const reminderHours2 = row2 ? parseInt(row2.value, 10) : 24;

    const deviceCount = await prisma.deviceToken.count();

    const { FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY } = process.env;
    const fcmConfigured = !!(FCM_PROJECT_ID && FCM_CLIENT_EMAIL && FCM_PRIVATE_KEY);

    return res.status(200).json({ reminderHours, reminderHours2, deviceCount, fcmConfigured });
  }

  /**
   * PUT /api/notifications/settings
   * Update notification settings (admin only).
   * Body: { reminderHours: number, reminderHours2: number }
   */
  async updateSettings(req: Request, res: Response) {
    const { reminderHours, reminderHours2 } = req.body as { reminderHours?: number; reminderHours2?: number };

    if (
      typeof reminderHours !== 'number' ||
      !Number.isInteger(reminderHours) ||
      reminderHours < 1 ||
      reminderHours > 720
    ) {
      return res.status(400).json({ error: 'reminderHours must be an integer between 1 and 720' });
    }

    if (
      typeof reminderHours2 !== 'number' ||
      !Number.isInteger(reminderHours2) ||
      reminderHours2 < 1 ||
      reminderHours2 > 336
    ) {
      return res.status(400).json({ error: 'reminderHours2 must be an integer between 1 and 336' });
    }

    await Promise.all([
      prisma.appSetting.upsert({
        where: { key: 'eventReminderHours' },
        create: { key: 'eventReminderHours', value: String(reminderHours) },
        update: { value: String(reminderHours) },
      }),
      prisma.appSetting.upsert({
        where: { key: 'eventReminderHours2' },
        create: { key: 'eventReminderHours2', value: String(reminderHours2) },
        update: { value: String(reminderHours2) },
      }),
    ]);

    return res.status(200).json({ reminderHours, reminderHours2 });
  }

  /**
   * GET /api/notifications/inbox
   * Returns the authenticated user's notification history (newest first).
   */
  async getInbox(req: Request, res: Response) {
    const userId = Number(req.user!.id);
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.status(200).json(notifications);
  }

  /**
   * PATCH /api/notifications/inbox/:id/read
   * Mark a single notification as read (must belong to the calling user).
   */
  async markRead(req: Request, res: Response) {
    const userId = Number(req.user!.id);
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const updated = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    if (updated.count === 0) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ ok: true });
  }

  /**
   * PATCH /api/notifications/inbox/read-all
   * Mark all of the calling user's notifications as read.
   */
  async markAllRead(req: Request, res: Response) {
    const userId = Number(req.user!.id);
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return res.status(200).json({ ok: true });
  }

  /**
   * DELETE /api/notifications/inbox/:id
   * Delete a single notification (must belong to the calling user).
   */
  async deleteNotification(req: Request, res: Response) {
    const userId = Number(req.user!.id);
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const deleted = await prisma.notification.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ ok: true });
  }

  /**
   * DELETE /api/notifications/inbox
   * Delete ALL notifications for the calling user (clear inbox).
   */
  async clearInbox(req: Request, res: Response) {
    const userId = Number(req.user!.id);
    await prisma.notification.deleteMany({ where: { userId } });
    return res.status(200).json({ ok: true });
  }

  /**
   * GET /api/notifications/history
   * Admin: returns all sent notifications deduplicated by batch
   * (notifications sent at the same second share the same title/body/link).
   */
  async getHistory(req: Request, res: Response) {
    const rows = await prisma.$queryRaw<
      { title: string; body: string; link: string | null; recipient_count: number; sent_at: Date }[]
    >`
      SELECT
        title,
        body,
        link,
        COUNT(*)::int AS recipient_count,
        MIN("createdAt") AS sent_at
      FROM notifications
      GROUP BY title, body, link, date_trunc('second', "createdAt")
      ORDER BY sent_at DESC
      LIMIT 100
    `;
    return res.status(200).json(rows);
  }

  /**
   * POST /api/notifications/trigger-reminders
   * Manually run the event reminder check (admin only). Useful for testing.
   */
  async triggerReminders(_req: Request, res: Response) {
    try {
      const { eventsFound, totalSent } = await testEventReminders();
      return res.status(200).json({ ok: true, eventsFound, totalSent });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message ?? 'Unknown error' });
    }
  }
}

export default new NotificationsController();
