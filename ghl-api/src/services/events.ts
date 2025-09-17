interface Event {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  location?: string;
  isVirtual: boolean;
  maxAttendees?: number;
  ownerId: string;
  status: 'draft' | 'published' | 'cancelled';
  visibility: 'public' | 'members' | 'restricted';
  createdAt: string;
  updatedAt: string;
}

interface RSVP {
  id: string;
  eventId: string;
  memberId: string;
  status: 'attending' | 'not-attending' | 'maybe';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EventStats {
  attending: number;
  notAttending: number;
  maybe: number;
  totalResponses: number;
}

export class EventsService {
  private events: Map<string, Event> = new Map();
  private rsvps: Map<string, RSVP> = new Map();
  private nextId = 1;

  constructor() {
    this.initializeDefaultEvents();
  }

  /**
   * Get all events (with optional filtering)
   */
  async getEvents(filters?: {
    status?: 'draft' | 'published' | 'cancelled';
    visibility?: 'public' | 'members' | 'restricted';
    startDate?: string;
    endDate?: string;
    ownerId?: string;
  }): Promise<Event[]> {
    let events = Array.from(this.events.values());

    if (filters) {
      if (filters.status) {
        events = events.filter(event => event.status === filters.status);
      }
      if (filters.visibility) {
        events = events.filter(event => event.visibility === filters.visibility);
      }
      if (filters.startDate) {
        events = events.filter(event => new Date(event.startsAt) >= new Date(filters.startDate!));
      }
      if (filters.endDate) {
        events = events.filter(event => new Date(event.endsAt) <= new Date(filters.endDate!));
      }
      if (filters.ownerId) {
        events = events.filter(event => event.ownerId === filters.ownerId);
      }
    }

    return events.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }

  /**
   * Get a single event by ID
   */
  async getEventById(id: string): Promise<Event | null> {
    return this.events.get(id) || null;
  }

  /**
   * Create a new event
   */
  async createEvent(eventData: Partial<Event>, ownerId: string): Promise<Event> {
    // Validate required fields
    if (!eventData.title) {
      throw new Error('Event title is required');
    }

    // Validate date order
    if (eventData.endsAt && eventData.startsAt && new Date(eventData.endsAt) < new Date(eventData.startsAt)) {
      throw new Error('End time must be after start time');
    }

    const id = `evt_${this.nextId++}`;
    const now = new Date().toISOString();
    
    const event: Event = {
      id,
      title: eventData.title.trim(),
      description: eventData.description?.trim() || undefined,
      startsAt: eventData.startsAt || new Date().toISOString(),
      endsAt: eventData.endsAt || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      location: eventData.location?.trim() || undefined,
      isVirtual: eventData.isVirtual || false,
      maxAttendees: eventData.maxAttendees || undefined,
      ownerId,
      status: eventData.status || 'draft',
      visibility: eventData.visibility || 'public',
      createdAt: now,
      updatedAt: now
    };

    this.events.set(id, event);
    return event;
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    id: string,
    updates: Partial<Event>,
    requesterId: string
  ): Promise<Event> {
    const event = this.events.get(id);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check permissions
    if (event.ownerId !== requesterId) {
      throw new Error('Only the event owner can update this event');
    }

    const updatedEvent: Event = {
      ...event,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };

    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string, requesterId: string): Promise<void> {
    const event = this.events.get(id);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.ownerId !== requesterId) {
      throw new Error('Only the event owner can delete this event');
    }

    this.events.delete(id);
  }

  /**
   * Create or update RSVP for an event
   */
  async createOrUpdateRsvp(
    eventId: string,
    memberId: string,
    rsvpData: {
      status: 'attending' | 'not-attending' | 'maybe';
      notes?: string;
    }
  ): Promise<RSVP> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const existingRsvp = Array.from(this.rsvps.values())
      .find(rsvp => rsvp.eventId === eventId && rsvp.memberId === memberId);

    const now = new Date().toISOString();

    if (existingRsvp) {
      const updatedRsvp: RSVP = {
        ...existingRsvp,
        status: rsvpData.status,
        notes: rsvpData.notes,
        updatedAt: now
      };
      this.rsvps.set(existingRsvp.id, updatedRsvp);
      return updatedRsvp;
    } else {
      const id = `rsvp_${this.nextId++}`;
      const rsvp: RSVP = {
        id,
        eventId,
        memberId,
        status: rsvpData.status,
        notes: rsvpData.notes,
        createdAt: now,
        updatedAt: now
      };
      this.rsvps.set(id, rsvp);
      return rsvp;
    }
  }

  /**
   * Get all RSVPs for an event
   */
  async getEventRsvps(eventId: string): Promise<RSVP[]> {
    return Array.from(this.rsvps.values())
      .filter(rsvp => rsvp.eventId === eventId);
  }

  /**
   * Get event statistics
   */
  async getEventStats(eventId: string): Promise<EventStats> {
    const rsvps = await this.getEventRsvps(eventId);
    
    const stats: EventStats = {
      attending: 0,
      notAttending: 0,
      maybe: 0,
      totalResponses: rsvps.length
    };

    rsvps.forEach(rsvp => {
      stats[rsvp.status === 'attending' ? 'attending' : 
           rsvp.status === 'not-attending' ? 'notAttending' : 'maybe']++;
    });

    return stats;
  }

  /**
   * Initialize default events for testing
   */
  private initializeDefaultEvents(): void {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const defaultEvent: Event = {
      id: 'evt_1',
      title: 'Monthly Member Meeting',
      description: 'Join us for our monthly member meeting.',
      startsAt: futureDate.toISOString(),
      endsAt: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      location: 'Chamber Office',
      isVirtual: false,
      maxAttendees: 50,
      ownerId: 'admin',
      status: 'published',
      visibility: 'members',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    this.events.set(defaultEvent.id, defaultEvent);
    this.nextId = 2;
  }
}

// Export a singleton instance
export const eventsService = new EventsService();
module.exports = { eventsService };
