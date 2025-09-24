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
    // Use session-based member ID for public access
    let memberId = req.member?.id;
    
    if (!memberId) {
      // Create a temporary session-based member ID for public users
      const sessionId = req.sessionID || req.get('x-session-id') || `session-${Date.now()}`;
      memberId = `public-user-${sessionId}`;
    }

    // Skip permission and limit checks for public users
    const isPublicUser = memberId.startsWith('public-user-');
    
    if (!isPublicUser) {
      // Check permissions for authenticated users
      if (!await permissionService.canPerformAction(memberId, 'create', 'event')) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          details: 'Event creation not allowed'
        });
      }

      // Check content limits for authenticated users
      if (!await contentLimitService.canCreateContent(memberId, 'event')) {
        const limits = await contentLimitService.getMemberLimits(memberId);
        return res.status(429).json({
          error: 'Content limit exceeded',
          details: `You have reached your event limit (${limits.event.current}/${limits.event.limit})`
        });
      }
    }

    const eventData = req.body;
    const event = await eventsService.createEvent(eventData, memberId);

    // Record content creation for limits tracking (only for authenticated users)
    if (!isPublicUser) {
      await contentLimitService.recordContentCreation(memberId, 'event');
    }

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
    
    // Use session-based member ID for public access
    let memberId = req.member?.id;
    
    if (!memberId) {
      // Create a temporary session-based member ID for public users
      const sessionId = req.sessionID || req.get('x-session-id') || `session-${Date.now()}`;
      memberId = `public-user-${sessionId}`;
    }

    const event = await eventsService.getEvent(id);
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Skip permission checks for public users (they can edit their own public events)
    const isPublicUser = memberId.startsWith('public-user-');
    
    if (!isPublicUser) {
      // Check permissions - owner or admin for authenticated users
      if (!await permissionService.canPerformAction(memberId, 'edit', 'event', event.ownerId)) {
        return res.status(403).json({
          error: 'Insufficient permissions'
        });
      }
    }

    // For now, skip version checking for public users to simplify the flow
    if (!isPublicUser && typeof expectedVersion !== 'number') {
      return res.status(400).json({
        error: 'expectedVersion is required for updates',
        details: 'Include the current event version to prevent conflicts'
      });
    }

    const updatedEvent = await eventsService.updateEvent(id, updates, expectedVersion || 1);
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
    const { status, guestCount, notes } = req.body;
    // For public access, use a temporary member ID
    // In production, this would come from authentication
    const memberId = req.member?.id || 'public-user-' + Date.now();

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
      guestCount,
      notes
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
    // For public access, try to get member ID from query params as fallback
    const memberId = req.member?.id || req.query.memberId;

    if (!memberId) {
      // Return empty response instead of authentication error for public access
      return res.json(null);
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

/**
 * GET /events/moderation-queue
 * Get events pending moderation
 */
router.get('/moderation-queue', async (req: any, res) => {
  try {
    const memberId = req.member?.id || req.query.memberId;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check if user has moderation permissions
    const hasPermission = await permissionService.hasModerationAccess(memberId);
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Moderation access required'
      });
    }

    const events = await eventsService.getEvents({ status: 'draft' });
    const pendingEvents = events.filter(event => event.status === 'draft' || event.needsApproval);

    res.json({
      events: pendingEvents,
      total: pendingEvents.length
    });

  } catch (error) {
    console.error('Moderation queue error:', error);
    res.status(500).json({
      error: 'Failed to retrieve moderation queue'
    });
  }
});

/**
 * POST /events/:id/approve
 * Approve an event
 */
router.post('/:id/approve', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const memberId = req.member?.id || req.query.memberId;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check if user has moderation permissions
    const hasPermission = await permissionService.hasModerationAccess(memberId);
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Moderation access required'
      });
    }

    const event = await eventsService.getEvent(id);
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Update event status to published
    const updatedEvent = await eventsService.updateEvent(id, {
      status: 'published',
      moderatedBy: memberId,
      moderatedAt: new Date().toISOString(),
      moderationReason: reason || 'Approved'
    });

    res.json({
      message: 'Event approved successfully',
      event: updatedEvent
    });

  } catch (error) {
    console.error('Event approval error:', error);
    res.status(500).json({
      error: 'Failed to approve event'
    });
  }
});

/**
 * POST /events/:id/reject
 * Reject an event
 */
router.post('/:id/reject', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const memberId = req.member?.id || req.query.memberId;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check if user has moderation permissions
    const hasPermission = await permissionService.hasModerationAccess(memberId);
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Moderation access required'
      });
    }

    const event = await eventsService.getEvent(id);
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // Update event status to rejected
    const updatedEvent = await eventsService.updateEvent(id, {
      status: 'cancelled',
      moderatedBy: memberId,
      moderatedAt: new Date().toISOString(),
      moderationReason: reason || 'Rejected',
      rejectedReason: reason
    });

    res.json({
      message: 'Event rejected successfully',
      event: updatedEvent
    });

  } catch (error) {
    console.error('Event rejection error:', error);
    res.status(500).json({
      error: 'Failed to reject event'
    });
  }
});

/**
 * GET /events/moderation-access
 * Check if current user has moderation access
 */
router.get('/moderation-access', async (req: any, res) => {
  try {
    const memberId = req.member?.id || req.query.memberId;

    if (!memberId) {
      return res.json({ hasAccess: false });
    }

    const hasAccess = await permissionService.hasModerationAccess(memberId);
    res.json({ hasAccess });

  } catch (error) {
    console.error('Moderation access check error:', error);
    res.status(500).json({
      error: 'Failed to check moderation access'
    });
  }
});

export default router;
