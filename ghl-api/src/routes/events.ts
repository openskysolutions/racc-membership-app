// Events routes - chamber events with RSVP support (PUBLIC ACCESS)

import express from 'express';
const { eventsService } = require('@/services/events');
const { permissionService } = require('@/policies/permissions');
const { contentLimitService } = require('@/policies/limits');

const router = express.Router();

/**
 * GET /events
 * List events with optional date filtering (PUBLIC - no authentication required)
 */
router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate, visibility, limit, offset } = req.query;

    // Parse pagination parameters
    const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset as string, 10) : undefined;

    // Call getEvents instead of listEvents
    const events = await eventsService.getEvents({
      status: status as 'draft' | 'published' | 'cancelled',
      startDate: startDate as string,
      endDate: endDate as string,
      visibility: visibility as string
    });

    // Apply pagination manually since the service doesn't handle it
    const startIndex = parsedOffset || 0;
    const endIndex = parsedLimit ? startIndex + parsedLimit : events.length;
    const paginatedEvents = events.slice(startIndex, endIndex);

    res.json({
      events: paginatedEvents,
      total: events.length,
      limit: parsedLimit || events.length,
      offset: startIndex
    });

  } catch (error) {
    console.error('Events list error:', error);
    res.status(500).json({
      error: 'Failed to retrieve events'
    });
  }
});

/**
 * GET /events/:id
 * Get specific event details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await eventsService.getEvent(id);
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Get RSVP stats if event allows RSVP
    if (event.allowRsvp) {
      const stats = await eventsService.getEventStats(id);
      event.rsvpStats = stats;
    }

    res.json(event);

  } catch (error) {
    console.error('Event retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve event'
    });
  }
});

/**
 * POST /events
 * Create a new event
 */
router.post('/', async (req: any, res) => {
  try {
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check permissions
    if (!await permissionService.canPerformAction(memberId, 'create', 'event')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Event creation not allowed'
      });
    }

    // Check content limits
    if (!await contentLimitService.canCreateContent(memberId, 'event')) {
      const limits = await contentLimitService.getMemberLimits(memberId);
      return res.status(429).json({
        error: 'Content limit exceeded',
        details: `You have reached your event limit (${limits.event.current}/${limits.event.limit})`
      });
    }

    const eventData = req.body;
    const event = await eventsService.createEvent(eventData, memberId);

    // Record content creation for limits tracking
    await contentLimitService.recordContentCreation(memberId, 'event');

    res.status(201).json(event);

  } catch (error) {
    console.error('Event creation error:', error);
    
    if (error.message.includes('required') || error.message.includes('after')) {
      return res.status(400).json({
        error: 'Invalid event data',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to create event'
    });
  }
});

/**
 * PATCH /events/:id
 * Update an existing event
 */
router.patch('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { expectedVersion, ...updates } = req.body;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const event = await eventsService.getEvent(id);
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Check permissions - owner or admin
    if (!await permissionService.canPerformAction(memberId, 'edit', 'event', event.ownerId)) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    if (typeof expectedVersion !== 'number') {
      return res.status(400).json({
        error: 'expectedVersion is required for updates',
        details: 'Include the current event version to prevent conflicts'
      });
    }

    const updatedEvent = await eventsService.updateEvent(id, updates, expectedVersion);
    res.json(updatedEvent);

  } catch (error) {
    console.error('Event update error:', error);
    
    if (error.message.includes('modified by another user')) {
      return res.status(409).json({
        error: 'Conflict',
        details: error.message
      });
    }

    if (error.message.includes('after')) {
      return res.status(400).json({
        error: 'Invalid event data',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to update event'
    });
  }
});

/**
 * DELETE /events/:id
 * Delete an event
 */
router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const event = await eventsService.getEvent(id);
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Check permissions - owner or admin
    if (!await permissionService.canPerformAction(memberId, 'delete', 'event', event.ownerId)) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    await eventsService.deleteEvent(id, memberId);
    res.status(204).send();

  } catch (error) {
    console.error('Event deletion error:', error);
    
    if (error.message.includes('Only event owner')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to delete event'
    });
  }
});

/**
 * POST /events/:id/rsvp
 * Create or update RSVP for an event
 */
router.post('/:id/rsvp', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, guestCount } = req.body;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Validate RSVP status
    const validStatuses = ['attending', 'not-attending', 'maybe'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid RSVP status',
        details: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Validate guest count
    if (guestCount !== undefined && (typeof guestCount !== 'number' || guestCount < 0)) {
      return res.status(400).json({
        error: 'Invalid guest count',
        details: 'Guest count must be a non-negative number'
      });
    }

    const rsvp = await eventsService.createOrUpdateRsvp(id, memberId, {
      status,
      guestCount
    });

    res.status(201).json(rsvp);

  } catch (error) {
    console.error('RSVP creation error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    if (error.message.includes('not allowed')) {
      return res.status(400).json({
        error: 'RSVP not allowed',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to create RSVP'
    });
  }
});

/**
 * GET /events/:id/rsvps
 * Get RSVPs for an event (event owner or admin only)
 */
router.get('/:id/rsvps', async (req: any, res) => {
  try {
    const { id } = req.params;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const event = await eventsService.getEvent(id);
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Check permissions - event owner or admin
    const isAdmin = await permissionService.isAdmin(memberId);
    const isOwner = event.ownerId === memberId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Only event owner or admin can view RSVPs'
      });
    }

    const rsvps = await eventsService.getEventRsvps(id);
    res.json({ rsvps });

  } catch (error) {
    console.error('RSVPs retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve RSVPs'
    });
  }
});

/**
 * GET /events/:id/my-rsvp
 * Get current member's RSVP for an event
 */
router.get('/:id/my-rsvp', async (req: any, res) => {
  try {
    const { id } = req.params;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const rsvp = await eventsService.getMemberRsvp(id, memberId);
    if (!rsvp) {
      return res.status(404).json({
        error: 'RSVP not found'
      });
    }

    res.json(rsvp);

  } catch (error) {
    console.error('My RSVP retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve RSVP'
    });
  }
});

export default router;
