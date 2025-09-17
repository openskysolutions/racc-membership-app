// Events service - handles event CRUD operations with version control and RSVP

import { Event, EventRsvp } from '@/models/index.js';

/**
 * Service for managing chamber events with RSVP support
 */
export class EventsService {
  events = new Map<string, Event>(); // In-memory storage for now
  rsvps = new Map<string, EventRsvp>(); // Event RSVPs
  nextId = 1;
  nextRsvpId = 1;

  /**
   * List events with optional date filtering
   * @param options - Filtering and pagination options
   * @returns Object with events array
   */
  async listEvents(options) {
    let events = Array.from(this.events.values());

    // Filter by date range
    if (options && options.startDate) {
      events = events.filter(event => 
        new Date(event.startsAt) >= new Date(options.startDate!)
      );
    }
    if (options?.endDate) {
      events = events.filter(event => 
        new Date(event.startsAt) <= new Date(options.endDate!)
      );
    }

    // Filter by visibility
    if (options?.visibility) {
      events = events.filter(event => event.visibility === options.visibility);
    }

    // Sort by start date
    events.sort((a, b) => 
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );

    // Apply pagination
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const paginatedEvents = events.slice(offset, offset + limit);

    return { events: paginatedEvents };
  }

  /**
   * Get event by ID
   * @param id - Event ID
   * @returns Event object or null if not found
   */
  async getEvent(id) {
    return this.events.get(id) || null;
  }

  /**
   * Create a new event
   * @param eventData - Event details
   * @param ownerId - ID of the member creating the event
   * @returns Created event
   */
  async createEvent(eventData: {
    title;

  /**
   * Create a new event
   */
  async createEvent(eventData, ownerId) {
    // Validate required fields
    if (!eventData.title) {
      throw new Error('Event title is required');
    }

    // Validate date order
    if (new Date(eventData.endsAt) < new Date(eventData.startsAt)) {
      throw new Error('End time must be after start time');
    }

    const id = `evt_${this.nextId++}`;
    const now = new Date().toISOString();
    
    const event = {
      id,
      title: eventData.title.trim(),
      description: eventData.description?.trim() || undefined,
      startsAt: eventData.startsAt,
      endsAt: eventData.endsAt,
      location: eventData.location?.trim() || undefined,
      visibility: eventData.visibility || 'public',
      ownerId,
      version: 1,
      allowRsvp: eventData.allowRsvp || false,
      maxAttendees: eventData.maxAttendees || undefined,
      createdAt: now,
      updatedAt: now
    };

    this.events.set(id, event);
    return event;
  }

  /**
   * Update an existing event with optimistic locking
   * @param id - Event ID
   * @param updates - Event updates
   * @param expectedVersion - Expected version for optimistic locking
   * @returns Updated event
   */
  async updateEvent(
    id, 
    updates, 
    expectedVersion
  ) {
    const event = this.events.get(id);
    if (!event) {
      throw new Error('Event not found');
    }

    // Optimistic locking check
    if (event.version !== expectedVersion) {
      throw new Error('Event has been modified by another user. Please refresh and try again.');
    }

    // Validate date order if dates are being updated
    const newStartsAt = updates.startsAt || event.startsAt;
    const newEndsAt = updates.endsAt || event.endsAt;
    if (new Date(newEndsAt) < new Date(newStartsAt)) {
      throw new Error('End time must be after start time');
    }

    const updatedEvent = {
      ...event,
      ...updates,
      version: event.version + 1,
      updatedAt: new Date().toISOString()
    };

    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  /**
   * Delete an event
   * @param id - Event ID
   * @param requesterId - ID of the member requesting deletion
   */
  async deleteEvent(id, requesterId) {
    const event = this.events.get(id);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check ownership (in production, also check admin permissions)
    if (event.ownerId !== requesterId) {
      throw new Error('Only event owner can delete this event');
    }

    // Delete associated RSVPs
    const eventRsvps = Array.from(this.rsvps.values())
      .filter(rsvp => rsvp.eventId === id);
    eventRsvps.forEach(rsvp => this.rsvps.delete(rsvp.id));

    this.events.delete(id);
  }

  /**
   * Create or update RSVP for an event
   * @param eventId - Event ID
   * @param memberId - Member ID
   * @param rsvpData - RSVP details
   * @returns RSVP object
   */
  async createOrUpdateRsvp(
    eventId, 
    memberId, 
    rsvpData: {
      status:  | 'maybe';

    }
  ) {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.allowRsvp) {
      throw new Error('RSVP not allowed for this event');
    }

    // Check if RSVP already exists
    const existingRsvp = Array.from(this.rsvps.values())
      .find(rsvp => rsvp.eventId === eventId && rsvp.memberId === memberId);

    const now = new Date().toISOString();

    if (existingRsvp) {
      // Update existing RSVP
      const updatedRsvp = {
        ...existingRsvp,
        status: rsvpData.status,
        guestCount: rsvpData.guestCount || 0,
        updatedAt: now
      };
      this.rsvps.set(existingRsvp.id, updatedRsvp);
      return updatedRsvp;
    } else {
      // Create new RSVP
      const rsvpId = `rsvp_${this.nextRsvpId++}`;
      const newRsvp = {
        id: rsvpId,
        eventId,
        memberId,
        status: rsvpData.status,
        guestCount: rsvpData.guestCount || 0,
        createdAt: now,
        updatedAt: now
      };
      this.rsvps.set(rsvpId, newRsvp);
      return newRsvp;
    }
  }

  /**
   * Get RSVPs for an event
   * @param eventId - Event ID
   * @returns Array of RSVPs
   */
  async getEventRsvps(eventId) {
    return Array.from(this.rsvps.values())
      .filter(rsvp => rsvp.eventId === eventId);
  }

  /**
   * Get member's RSVP for an event
   * @param eventId - Event ID
   * @param memberId - Member ID
   * @returns RSVP object or null
   */
  async getMemberRsvp(eventId, memberId) {
    return Array.from(this.rsvps.values())
      .find(rsvp => rsvp.eventId === eventId && rsvp.memberId === memberId) || null;
  }

  /**
   * Get event attendance statistics
   * @param eventId - Event ID
   * @returns Attendance counts
   */
  async getEventStats(eventId) {
    attending;
    notAttending;
    maybe;
    totalGuests;
  }> {
    const rsvps = await this.getEventRsvps(eventId);
    
    const stats = {
      attending: 0,
      notAttending: 0,
      maybe: 0,
      totalGuests: 0
    };

    rsvps.forEach(rsvp => {
      switch (rsvp.status) {
        case 'attending':
          stats.attending++;
          stats.totalGuests += rsvp.guestCount || 0;
          break;
        case 'not-attending':
          stats.notAttending++;
          break;
        case 'maybe':
          stats.maybe++;
          break;
      }
    });

    return stats;
  }
}

// Singleton instance
export const eventsService = new EventsService();
