import { api } from '@/services/apiClient';

export interface Event {
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

export interface RSVP {
  id: string;
  eventId: string;
  memberId: string;
  status: 'attending' | 'not-attending' | 'maybe';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all events with optional filters
 */
export async function getEventsList(filters?: {
  status?: 'draft' | 'published' | 'cancelled';
  visibility?: 'public' | 'members' | 'restricted';
  startDate?: string;
  endDate?: string;
}): Promise<Event[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.visibility) params.append('visibility', filters.visibility);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const queryString = params.toString();
    const url = `/events${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

/**
 * Get a single event by ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  try {
    const response = await api.get(`/events/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch event: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
}

/**
 * Create a new event
 */
export async function createEvent(eventData: Partial<Event>): Promise<Event> {
  try {
    const response = await api.post('/events', eventData);
    
    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
  try {
    const response = await api.patch(`/events/${id}`, updates);
    
    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string): Promise<void> {
  try {
    const response = await api.delete(`/events/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to delete event: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

/**
 * Create or update RSVP for an event
 */
export async function createOrUpdateRSVP(
  eventId: string,
  rsvpData: {
    status: 'attending' | 'not-attending' | 'maybe';
    notes?: string;
  }
): Promise<RSVP> {
  try {
    const response = await api.post(`/events/${eventId}/rsvp`, rsvpData);
    
    if (!response.ok) {
      throw new Error(`Failed to create/update RSVP: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating/updating RSVP:', error);
    throw error;
  }
}

/**
 * Get RSVPs for an event
 */
export async function getEventRSVPs(eventId: string): Promise<RSVP[]> {
  try {
    const response = await api.get(`/events/${eventId}/rsvps`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSVPs: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    throw error;
  }
}

/**
 * Get current user's RSVP for an event
 */
export async function getMyRSVP(eventId: string): Promise<RSVP | null> {
  try {
    const response = await api.get(`/events/${eventId}/my-rsvp`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch RSVP: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching my RSVP:', error);
    throw error;
  }
}
