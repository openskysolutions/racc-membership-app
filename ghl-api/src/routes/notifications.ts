/**
 * Notifications Routes
 *
 * POST   /api/notifications/register    – register device token (auth required)
 * DELETE /api/notifications/register    – unregister device token (auth required)
 * POST   /api/notifications/send        – send a notification (admin only)
 * GET    /api/notifications/settings    – get notification settings (admin only)
 * PUT    /api/notifications/settings    – update notification settings (admin only)
 * GET    /api/notifications/inbox       – get current user's notification inbox
 * PATCH  /api/notifications/inbox/read-all  – mark all as read
 * PATCH  /api/notifications/inbox/:id/read  – mark one as read
 * POST   /api/notifications/trigger-reminders – manually run reminder check (admin only)
 */

import express from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';
import notificationsController from '@/controllers/notificationsController';

const router = express.Router();

router.post('/register', requireAuth, (req, res) =>
  notificationsController.registerToken(req, res)
);

router.delete('/register', requireAuth, (req, res) =>
  notificationsController.unregisterToken(req, res)
);

router.post('/send', requireAuth, requireAdmin, (req, res) =>
  notificationsController.sendNotification(req, res)
);

router.get('/settings', requireAuth, requireAdmin, (req, res) =>
  notificationsController.getSettings(req, res)
);

router.put('/settings', requireAuth, requireAdmin, (req, res) =>
  notificationsController.updateSettings(req, res)
);

router.get('/inbox', requireAuth, (req, res) =>
  notificationsController.getInbox(req, res)
);

router.patch('/inbox/read-all', requireAuth, (req, res) =>
  notificationsController.markAllRead(req, res)
);

router.patch('/inbox/:id/read', requireAuth, (req, res) =>
  notificationsController.markRead(req, res)
);

router.delete('/inbox', requireAuth, (req, res) =>
  notificationsController.clearInbox(req, res)
);

router.delete('/inbox/:id', requireAuth, (req, res) =>
  notificationsController.deleteNotification(req, res)
);

router.get('/history', requireAuth, requireAdmin, (req, res) =>
  notificationsController.getHistory(req, res)
);

router.post('/trigger-reminders', requireAuth, requireAdmin, (req, res) =>
  notificationsController.triggerReminders(req, res)
);

export default router;
