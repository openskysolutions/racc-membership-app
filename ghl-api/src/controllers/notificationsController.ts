/**
 * Notifications Controller
 * Handles device token registration and admin-initiated push notification sends.
 */

import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { sendToAll, sendToUsers } from '@/services/notificationService';

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
    const row = await prisma.appSetting.findUnique({ where: { key: 'eventReminderHours' } });
    const reminderHours = row ? parseInt(row.value, 10) : 24;

    const deviceCount = await prisma.deviceToken.count();

    const { FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY } = process.env;
    const fcmConfigured = !!(FCM_PROJECT_ID && FCM_CLIENT_EMAIL && FCM_PRIVATE_KEY);

    return res.status(200).json({ reminderHours, deviceCount, fcmConfigured });
  }

  /**
   * PUT /api/notifications/settings
   * Update notification settings (admin only).
   * Body: { reminderHours: number }
   */
  async updateSettings(req: Request, res: Response) {
    const { reminderHours } = req.body as { reminderHours?: number };

    if (
      typeof reminderHours !== 'number' ||
      !Number.isInteger(reminderHours) ||
      reminderHours < 1 ||
      reminderHours > 168
    ) {
      return res.status(400).json({ error: 'reminderHours must be an integer between 1 and 168' });
    }

    await prisma.appSetting.upsert({
      where: { key: 'eventReminderHours' },
      create: { key: 'eventReminderHours', value: String(reminderHours) },
      update: { value: String(reminderHours) },
    });

    return res.status(200).json({ reminderHours });
  }
}

export default new NotificationsController();
