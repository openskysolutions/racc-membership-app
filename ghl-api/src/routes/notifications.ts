/**
 * Notifications Routes
 *
 * POST   /api/notifications/register    – register device token (auth required)
 * DELETE /api/notifications/register    – unregister device token (auth required)
 * POST   /api/notifications/send        – send a notification (admin only)
 * GET    /api/notifications/settings    – get notification settings (admin only)
 * PUT    /api/notifications/settings    – update notification settings (admin only)
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

export default router;
