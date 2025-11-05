/**
 * Calendar Service - Handles GoHighLevel calendar event integration
 */

import { api } from './apiClient';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  calendarId: string;
  status: 'confirmed' | 'cancelled' | 'tentative';
  attendees?: Array<{
    email: string;
    name?: string;
    responseStatus: string;
  }>;
  isAllDay?: boolean;
  timezone?: string;
  // Additional HighLevel fields
  internalNote?: string;
  calendarNotes?: string;
  appointmentStatus?: string;
  contactId?: string;
  // Recurring event fields
  isRecurring?: boolean;
  rrule?: string;
  originalRecurringEventId?: string; // Alternative field name
  masterEventId?: string; // GoHighLevel's field for linking instances to master
  // Custom fields
  pageUrl?: string;
  coverImageUrl?: string;
  downloadFileUrl?: string;
}

export interface CreateEventPayload {
  calendarId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  contactId: string;
  appointmentStatus?: 'new' | 'scheduled' | 'confirmed' | 'cancelled';
  toNotify?: boolean;
  ignoreDateRange?: boolean;
  ignoreFreeSlotValidation?: boolean;
  selectedTimezone?: string;
  address?: string;
  meetingLocationType?: 'custom' | 'physical' | 'phone' | 'video';
  calendarNotes?: string;
  internalNote?: string;
  source?: string;
  channel?: string;
  // Custom fields
  pageUrl?: string;
  coverImageUrl?: string;
  downloadFileUrl?: string;
  customFieldsRecordId?: string;
}

export interface UpdateEventPayload {
  calendarId?: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  appointmentStatus?: 'new' | 'scheduled' | 'confirmed' | 'cancelled';
  address?: string;
  calendarNotes?: string;
  internalNote?: string;
  // Custom fields
  pageUrl?: string;
  coverImageUrl?: string;
  downloadFileUrl?: string;
  customFieldsRecordId?: string;
  // Recurring event fields
  isCustomRecurring?: boolean;
  rrule?: string;
  selectedTimezone?: string;
  // Control how recurring events are updated
  // Only valid value is 'this_and_following_events' (updates this + all future)
  // Omit this field to update only the single instance
  recurringEventUpdateType?: 'this_and_following_events';
  ignoreDateRange?: boolean;
  ignoreFreeSlotValidation?: boolean;
  toNotify?: boolean;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  locationId: string;
  timezone: string;
}

/**
 * Get calendar events from GoHighLevel
 * @param calendarId - The GoHighLevel calendar ID
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @param bustCache - Optional flag to add cache-busting timestamp (use after updates)
 */
export async function getCalendarEvents(
  calendarId: string, 
  startDate?: Date, 
  endDate?: Date,
  bustCache?: boolean
): Promise<CalendarEvent[]> {
  try {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }
    // Add cache-busting parameter to force fresh data from GoHighLevel
    // This helps work around GoHighLevel's API caching of events list
    if (bustCache) {
      params.append('_t', Date.now().toString());
    }

    const queryString = params.toString();
    const url = `/calendars/${calendarId}/events${queryString ? `?${queryString}` : ''}`;
    
    console.log('[Calendar] Fetching events from:', url);
    const response = await api.get(url);
    
    console.log('[Calendar] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Calendar] Error response:', errorText);
      throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Calendar] Received data, event count:', Array.isArray(data) ? data.length : (data?.events?.length || 0));
    
    // Handle different response structures from GoHighLevel
    const events = data?.events || data || [];
    
    // Transform GoHighLevel event format to our format if needed
    return events.map((event: any) => ({
      id: event.id,
      title: event.title || event.name || 'Untitled Event',
      description: event.description,
      startTime: event.startTime || event.start_time,
      endTime: event.endTime || event.end_time,
      location: event.location,
      calendarId: event.calendarId || calendarId,
      status: event.status || 'confirmed',
      attendees: event.attendees || [],
      isAllDay: event.isAllDay || event.all_day || false,
      timezone: event.timezone || 'America/Denver',
      // Additional HighLevel fields
      internalNote: event.internalNote,
      calendarNotes: event.calendarNotes,
      appointmentStatus: event.appointmentStatus,
      contactId: event.contactId,
      // Custom fields (batch-loaded from backend)
      pageUrl: event.pageUrl,
      coverImageUrl: event.coverImageUrl,
      downloadFileUrl: event.downloadFileUrl,
      customFieldsRecordId: event.customFieldsRecordId,
      // Recurring event fields
      isRecurring: event.isRecurring,
      rrule: event.rrule,
      masterEventId: event.masterEventId
    }));
  } catch (error: any) {
    console.error('[Calendar] Error details:', {
      calendarId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      errorMessage: error?.message || 'Unknown error',
      errorName: error?.name,
      errorType: error?.constructor?.name,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL
    });
    throw error;
  }
}

/**
 * Get calendar information
 * @param calendarId - The GoHighLevel calendar ID
 */
export async function getCalendar(calendarId: string): Promise<Calendar> {
  try {
    const response = await api.get(`/calendars/${calendarId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.statusText}`);
    }
    
    const data = await response.json();
    const calendar = data?.calendar || data;
    
    return {
      id: calendar.id,
      name: calendar.name || 'RACC Events',
      description: calendar.description,
      locationId: calendar.locationId,
      timezone: calendar.timezone || 'America/Denver'
    };
  } catch (error: any) {
    console.error('Error fetching calendar:', error);
    throw new Error(`Failed to fetch calendar: ${error.message}`);
  }
}

/**
 * Get events for the current year (12 months)
 */
export async function getCurrentYearEvents(calendarId: string, bustCache?: boolean): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), now.getMonth(), 1); // Start from current month
  const endOfYear = new Date(now.getFullYear() + 1, now.getMonth(), 0, 23, 59, 59); // End 12 months from now
  
  return getCalendarEvents(calendarId, startOfYear, endOfYear, bustCache);
}

/**
 * Get events for the current month (keeping for backward compatibility)
 * @param calendarId - The GoHighLevel calendar ID
 */
export async function getCurrentMonthEvents(calendarId: string): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  return getCalendarEvents(calendarId, startOfMonth, endOfMonth);
}

/**
 * Get upcoming events (next year)
 * @param calendarId - The GoHighLevel calendar ID
 */
export async function getUpcomingEvents(calendarId: string): Promise<CalendarEvent[]> {
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);
  
  const events = await getCalendarEvents(calendarId, now, oneYearFromNow);
  
  // Sort by start time
  return events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/**
 * Get a single event by ID
 * @param eventId - The event/appointment ID
 */
export async function getEventById(eventId: string): Promise<CalendarEvent> {
  try {
    const response = await api.get(`/calendars/appointments/${eventId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch event: ${response.statusText} - ${errorData.message || ''}`);
    }
    
    const data = await response.json();
    const appointment = data?.appointment || data;
    
    // Transform response to CalendarEvent format
    return {
      id: appointment.id,
      title: appointment.title,
      description: appointment.description || appointment.calendarNotes,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      location: appointment.address || appointment.location,
      calendarId: appointment.calendarId,
      status: appointment.appointmentStatus || 'confirmed',
      attendees: appointment.attendees || [],
      isAllDay: appointment.isAllDay || false,
      timezone: appointment.selectedTimezone || 'America/Denver',
      // Additional HighLevel fields
      internalNote: appointment.internalNote,
      calendarNotes: appointment.calendarNotes,
      appointmentStatus: appointment.appointmentStatus,
      contactId: appointment.contactId,
      // Recurring event fields
      isRecurring: appointment.isRecurring,
      rrule: appointment.rrule,
      originalRecurringEventId: appointment.originalRecurringEventId,
      masterEventId: appointment.masterEventId
    };
  } catch (error: any) {
    console.error('Error fetching event:', error);
    throw new Error(`Failed to fetch event: ${error.message}`);
  }
}

/**
 * Format event date and time for display
 */
export function formatEventDateTime(startTime: string, endTime: string, isAllDay?: boolean): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  if (isAllDay) {
    return start.toLocaleDateString('en-US', dateOptions);
  }
  
  const dateStr = start.toLocaleDateString('en-US', dateOptions);
  const startTimeStr = start.toLocaleTimeString('en-US', timeOptions);
  const endTimeStr = end.toLocaleTimeString('en-US', timeOptions);
  
  // If same day
  if (start.toDateString() === end.toDateString()) {
    return `${dateStr}, ${startTimeStr} - ${endTimeStr}`;
  }
  
  // Multi-day event
  const endDateStr = end.toLocaleDateString('en-US', dateOptions);
  return `${dateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;
}

/**
 * Create a new calendar event/appointment in GoHighLevel
 * @param eventData - The event data to create
 */
export async function createCalendarEvent(eventData: CreateEventPayload): Promise<CalendarEvent> {
  try {
    console.log('Creating calendar event with data:', eventData);
    
    const response = await api.post('/calendars/appointments', eventData);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create calendar event: ${response.statusText} - ${errorData.message || ''}`);
    }
    
    const data = await response.json();
    const appointment = data?.appointment || data;
    
    console.log('Created calendar event:', appointment);
    
    // Transform response to CalendarEvent format
    return {
      id: appointment.id,
      title: appointment.title,
      description: appointment.description || appointment.calendarNotes,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      location: appointment.address || appointment.location,
      calendarId: appointment.calendarId,
      status: appointment.appointmentStatus || 'confirmed',
      attendees: [],
      isAllDay: false,
      timezone: appointment.selectedTimezone || 'America/Denver',
      // Additional HighLevel fields
      internalNote: appointment.internalNote,
      calendarNotes: appointment.calendarNotes,
      appointmentStatus: appointment.appointmentStatus,
      contactId: appointment.contactId
    };
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

/**
 * Update an existing calendar event/appointment in GoHighLevel
 * @param eventId - The event ID to update
 * @param eventData - The event data to update
 */
export async function updateCalendarEvent(eventId: string, eventData: UpdateEventPayload): Promise<CalendarEvent> {
  try {
    const url = `/calendars/appointments/${eventId}`;
    
    const response = await api.put(url, eventData);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to update calendar event: ${response.statusText} - ${errorData.message || ''}`);
    }
    
    const data = await response.json();
    const appointment = data?.appointment || data;
    
    console.log('Updated calendar event:', appointment);
    
    // Transform response to CalendarEvent format
    return {
      id: appointment.id,
      title: appointment.title,
      description: appointment.description || appointment.calendarNotes,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      location: appointment.address || appointment.location,
      calendarId: appointment.calendarId,
      status: appointment.appointmentStatus || 'confirmed',
      attendees: [],
      isAllDay: false,
      timezone: appointment.selectedTimezone || 'America/Denver',
      // Additional HighLevel fields
      internalNote: appointment.internalNote,
      calendarNotes: appointment.calendarNotes,
      appointmentStatus: appointment.appointmentStatus,
      contactId: appointment.contactId
    };
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    throw new Error(`Failed to update calendar event: ${error.message}`);
  }
}

/**
 * Update custom fields for all future events in a recurring series
 * This only updates custom fields (cover image, page URL, etc.) for all future instances
 * The main appointment fields (title, description, etc.) are handled by GoHighLevel's recurringEventUpdateType
 * @param calendarId - The calendar ID
 * @param currentEvent - The current event being edited
 * @param customFieldsUpdate - The custom fields to update (pageUrl, coverImageUrl, downloadFileUrl)
 */
export async function updateRecurringSeriesCustomFields(
  calendarId: string,
  currentEvent: CalendarEvent,
  customFieldsUpdate: {
    pageUrl?: string;
    coverImageUrl?: string;
    downloadFileUrl?: string;
    internalNote?: string;
  }
): Promise<number> {
  try {
    console.log('Updating custom fields for recurring series:', { 
      currentEventId: currentEvent.id,
      title: currentEvent.title,
      customFieldsUpdate
    });
    
    // Make a single API call to the backend
    // The backend will handle fetching all events and updating them
    const response = await api.post(
      `/calendars/appointments/${currentEvent.id}/recurring-series-custom-fields`,
      {
        calendarId,
        customFields: {
          pageUrl: customFieldsUpdate.pageUrl || '',
          coverImageUrl: customFieldsUpdate.coverImageUrl || '',
          downloadFileUrl: customFieldsUpdate.downloadFileUrl || '',
          internalNote: customFieldsUpdate.internalNote || ''
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to update recurring series: ${response.statusText} - ${errorData.message || ''}`);
    }
    
    const result = await response.json();
    console.log(`✓ Successfully updated ${result.updatedCount} events in recurring series`);
    
    return result.updatedCount || 0;
  } catch (error: any) {
    console.error('Error updating recurring series custom fields:', error);
    throw new Error(`Failed to update recurring series custom fields: ${error.message}`);
  }
}

/**
 * Delete a calendar event/appointment in GoHighLevel
 * @param eventId - The event ID to delete
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    console.log('Deleting calendar event:', eventId);
    
    const response = await api.delete(`/calendars/appointments/${eventId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to delete calendar event: ${response.statusText} - ${errorData.message || ''}`);
    }
    
    console.log('Deleted calendar event:', eventId);
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
}

/**
 * Get custom fields for a calendar event (lazy load)
 * @param eventId - The event/appointment ID
 */
export async function getEventCustomFields(eventId: string): Promise<{
  pageUrl: string;
  coverImageUrl: string;
  downloadFileUrl: string;
  internalNote: string;
  recordId?: string;
}> {
  try {
    
    // Add cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();
    const response = await api.get(`/calendars/appointments/${eventId}/custom-fields?_t=${timestamp}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch custom fields: ${response.statusText} - ${errorData.message || ''}`);
    }
    
    const customFields = await response.json();
    
    return customFields;
  } catch (error: any) {
    console.error('Error fetching custom fields:', error);
    // Return empty custom fields on error
    return {
      pageUrl: '',
      coverImageUrl: '',
      downloadFileUrl: '',
      internalNote: ''
    };
  }
}