/**
 * Settings Routes
 *
 * GET  /api/settings/featured-event  – get the current featured event ID (public)
 * PUT  /api/settings/featured-event  – set or clear the featured event ID (admin only)
 */

import express from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';

const router = express.Router();

const FEATURED_EVENT_KEY = 'featured_event_id';

/**
 * GET /api/settings/featured-event
 * Returns the GHL event ID that is currently marked as featured, or null.
 * Public – no authentication required.
 */
router.get('/featured-event', async (_req, res) => {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: FEATURED_EVENT_KEY },
    });

    res.json({ eventId: setting?.value ?? null });
  } catch (error) {
    console.error('Error fetching featured event setting:', error);
    res.status(500).json({ error: 'Failed to retrieve featured event setting' });
  }
});

/**
 * PUT /api/settings/featured-event
 * Body: { eventId: string | null }
 * Pass null to clear the featured event. Admin only.
 */
router.put('/featured-event', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.body as { eventId: string | null };

    if (eventId === null || eventId === undefined || eventId === '') {
      // Clear the featured event
      await prisma.appSetting.deleteMany({
        where: { key: FEATURED_EVENT_KEY },
      });
      return res.json({ success: true, eventId: null });
    }

    // Validate that eventId is a non-empty string
    if (typeof eventId !== 'string') {
      return res.status(400).json({ error: 'eventId must be a string or null' });
    }

    // Upsert the setting so only one event is featured at a time
    await prisma.appSetting.upsert({
      where: { key: FEATURED_EVENT_KEY },
      update: { value: eventId },
      create: { key: FEATURED_EVENT_KEY, value: eventId },
    });

    return res.json({ success: true, eventId });
  } catch (error) {
    console.error('Error updating featured event setting:', error);
    return res.status(500).json({ error: 'Failed to update featured event setting' });
  }
});

export default router;
