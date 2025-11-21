const { HighLevel } = require('@gohighlevel/api-client');
const { ghlService } = require('@/services/gohighlevel');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.calendars;

async function listCalendars(req, res, next) {
  try {
    const result = await svc.getCalendars({ locationId: req.query.locationId || process.env.LOCATION_ID }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getCalendarById(req, res, next) {
  try {
    const result = await ghlService.getCalendar(req.params.id);
    res.json(result);
  } catch (err) { 
    console.error('Error in getCalendarById:', err);
    res.status(500).json({
      error: {
        message: err.message || 'Failed to fetch calendar',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString()
      }
    });
  }
}

async function createCalendar(req, res, next) {
  try {
    const result = await svc.createCalendar({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateCalendar(req, res, next) {
  try {
    const result = await svc.updateCalendar({ calendarId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteCalendar(req, res, next) {
  try {
    await svc.deleteCalendar({ calendarId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Calendar Groups
async function getGroups(req, res, next) {
  try {
    const result = await svc.getGroups({ locationId: req.query.locationId || process.env.LOCATION_ID }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createCalendarGroup(req, res, next) {
  try {
    const result = await svc.createCalendarGroup({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function editGroup(req, res, next) {
  try {
    const result = await svc.editGroup({ groupId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteGroup(req, res, next) {
  try {
    await svc.deleteGroup({ groupId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

async function disableGroup(req, res, next) {
  try {
    const result = await svc.disableGroup({ groupId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Appointments
async function createAppointment(req, res, next) {
  try {
    // Extract custom fields and non-standard fields from the payload
    // These fields are not part of the GoHighLevel appointment schema
    const { 
      pageUrl, 
      coverImageUrl, 
      downloadFileUrl, 
      internalNote,
      basicEmbedCode,
      enhancedEmbedCode,
      eliteEmbedCode,
      source,
      channel, 
      meetingLocationType,
      ...appointmentData 
    } = req.body;
    
    // Clean up empty string fields - GoHighLevel may not handle them well
    const cleanedData = Object.entries(appointmentData).reduce((acc, [key, value]) => {
      // Only include non-empty values or explicitly false/0 values
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    // Add locationId to the payload (required by GHL API)
    const payloadWithLocation = {
      ...cleanedData,
      locationId: process.env.LOCATION_ID
    };
    

    
    // Create the appointment first (without custom fields)
    // NOTE: SDK's createAppointment expects data directly, NOT wrapped in { payload: ... }
    const result = await svc.createAppointment(payloadWithLocation);
    
    // If custom fields were provided, save them separately
    if (pageUrl || coverImageUrl || downloadFileUrl || internalNote || basicEmbedCode || enhancedEmbedCode || eliteEmbedCode) {
      try {
        const appointmentId = result.id;
        
        await ghlService.upsertAppointmentCustomObject(
          appointmentId,
          {
            pageUrl,
            coverImageUrl,
            downloadFileUrl,
            internalNote,
            basicEmbedCode,
            enhancedEmbedCode,
            eliteEmbedCode
          }
        );
      } catch (customFieldError) {
        console.error('⚠️ Warning: Failed to save custom fields:', customFieldError);
        // Don't fail the entire request if custom fields fail
      }
    }
    
    res.status(201).json(result);
  } catch (err) { 
    console.error('❌ Error creating appointment:', err);
    next(err); 
  }
}

async function getAppointment(req, res, next) {
  try {
    // Use our custom ghlService instead of the SDK due to URL template bug
    const result = await ghlService.getAppointment(req.params.id);
    res.json(result);
  } catch (err) { 
    console.error('Error fetching appointment:', err);
    next(err); 
  }
}

// Get custom fields for an appointment (lazy load)
async function getAppointmentCustomFields(req, res, next) {
  try {
    const appointmentId = req.params.id;
    
    const customFields = await ghlService.getAppointmentCustomFields(appointmentId);
    
    // Prevent caching to ensure fresh data after updates
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    if (!customFields) {
      // Return empty custom fields if none exist
      return res.json({
        pageUrl: '',
        coverImageUrl: '',
        downloadFileUrl: '',
        internalNote: '',
        basicEmbedCode: '',
        enhancedEmbedCode: '',
        eliteEmbedCode: ''
      });
    }
    
    res.json(customFields);
  } catch (err) {
    console.error('Error fetching appointment custom fields:', err);
    next(err);
  }
}

async function editAppointment(req, res, next) {
  try {
    if (!req.params.id) {
      return res.status(400).json({ 
        error: { message: 'Please provide a valid calendar event ID' }
      });
    }
    
    // Use our custom ghlService instead of the SDK due to URL template bug
    const result = await ghlService.updateAppointment(req.params.id, req.body);
    res.json(result);
  } catch (err) { 
    console.error('Error updating appointment:', err);
    next(err); 
  }
}

// Calendar Events
async function getCalendarEvents(req, res, next) {
  try {
    const calendarId = req.params.calendarId;
    const { startDate, endDate } = req.query;
    
    // Parse date parameters if provided
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    // Use our custom GoHighLevel service instead of the SDK
    const events = await ghlService.getCalendarEvents(calendarId, start, end);
    
    // Return the events array directly (not wrapped in events object)
    res.json(events);
  } catch (err) { 
    console.error('Error in getCalendarEvents:', err);
    next(err); 
  }
}

// Get all events for location (without specific calendar)
async function getAllLocationEvents(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse date parameters if provided
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    // Use our custom GoHighLevel service without specific calendar ID
    const events = await ghlService.getCalendarEvents(null, start, end);
    
    // Return the events array directly
    res.json(events);
  } catch (err) { 
    console.error('Error in getAllLocationEvents:', err);
    next(err); 
  }
}

async function deleteEvent(req, res, next) {
  try {
    await svc.deleteEvent({ eventId: req.params.id });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Blocked Slots
async function getBlockedSlots(req, res, next) {
  try {
    const result = await svc.getBlockedSlots({ calendarId: req.params.calendarId }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createBlockSlot(req, res, next) {
  try {
    const result = await svc.createBlockSlot({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function editBlockSlot(req, res, next) {
  try {
    const result = await svc.editBlockSlot({ slotId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Slots
async function getSlots(req, res, next) {
  try {
    const result = await svc.getSlots({ calendarId: req.params.calendarId }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Appointment Notes
async function getAppointmentNotes(req, res, next) {
  try {
    const result = await svc.getAppointmentNotes({ appointmentId: req.params.appointmentId }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createAppointmentNote(req, res, next) {
  try {
    const result = await svc.createAppointmentNote({ appointmentId: req.params.appointmentId, payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateAppointmentNote(req, res, next) {
  try {
    const result = await svc.updateAppointmentNote({ appointmentId: req.params.appointmentId, noteId: req.params.noteId, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteAppointmentNote(req, res, next) {
  try {
    await svc.deleteAppointmentNote({ appointmentId: req.params.appointmentId, noteId: req.params.noteId }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Calendar Resources
async function fetchCalendarResources(req, res, next) {
  try {
    const result = await svc.fetchCalendarResources({ calendarId: req.params.calendarId }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createCalendarResource(req, res, next) {
  try {
    const result = await svc.createCalendarResource({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function getCalendarResource(req, res, next) {
  try {
    const result = await svc.getCalendarResource({ resourceId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function updateCalendarResource(req, res, next) {
  try {
    const result = await svc.updateCalendarResource({ resourceId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteCalendarResource(req, res, next) {
  try {
    await svc.deleteCalendarResource({ resourceId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Event Notifications
async function getEventNotification(req, res, next) {
  try {
    const result = await svc.getEventNotification({ notificationId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createEventNotification(req, res, next) {
  try {
    const result = await svc.createEventNotification({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function findEventNotification(req, res, next) {
  try {
    const result = await svc.findEventNotification({ eventId: req.params.eventId }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function updateEventNotification(req, res, next) {
  try {
    const result = await svc.updateEventNotification({ notificationId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteEventNotification(req, res, next) {
  try {
    await svc.deleteEventNotification({ notificationId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Update custom fields for an appointment (without updating the appointment itself)
async function updateAppointmentCustomFields(req, res, next) {
  try {
    const appointmentId = req.params.id;
    const { customFields, recordId } = req.body;
    
    if (!customFields) {
      return res.status(400).json({ 
        error: { message: 'customFields object is required' }
      });
    }
    
    const result = await ghlService.upsertAppointmentCustomObject(
      appointmentId,
      customFields,
      recordId
    );
    
    res.json(result);
  } catch (err) {
    console.error('Error updating appointment custom fields:', err);
    next(err);
  }
}

async function validateGroupsSlug(req, res, next) {
  try {
    const result = await svc.validateGroupsSlug({ slug: req.params.slug }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

/**
 * Update custom fields for all events in a recurring series
 * This is more efficient than the frontend making individual calls for each event
 * POST /api/calendars/appointments/:id/recurring-series-custom-fields
 */
async function updateRecurringSeriesCustomFields(req, res, next) {
  try {
    const { id: appointmentId } = req.params;
    const { calendarId, customFields } = req.body;
    
    // Fetch the specific event and all future events in the series
    
    // Get all events from the calendar
    const now = new Date();
    const startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
    const endDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year ahead
    
    const allEvents = await ghlService.getCalendarEvents(calendarId, startDate, endDate);
    
    // Extract base ID helper function
    const extractBaseId = (eventId: string) => {
      return eventId.includes('_') && /\d{13}_\d+$/.test(eventId) 
        ? eventId.split('_')[0] 
        : eventId;
    };
    
    const currentBaseId = extractBaseId(appointmentId);
    
    // Find the current event to get its details
    const currentEvent = allEvents.find(e => e.id === appointmentId);
    if (!currentEvent) {
      throw new Error(`Event ${appointmentId} not found`);
    }
    
    // Determine the series ID
    const seriesId = currentEvent.masterEventId || currentEvent.originalRecurringEventId || currentBaseId;
    const currentEventDate = new Date(currentEvent.startTime);
    
    // Find all future events in the same recurring series
    const futureEvents = allEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventBaseId = extractBaseId(event.id);
      
      const isSameSeries = 
        (event.masterEventId && event.masterEventId === seriesId) ||
        (event.originalRecurringEventId && event.originalRecurringEventId === seriesId) ||
        eventBaseId === seriesId;
      
      const isFutureOrCurrent = eventDate >= currentEventDate;
      
      return isSameSeries && isFutureOrCurrent;
    });
    
    // Update custom fields for each future event
    // Note: All events in a recurring series share the same custom object record (using base ID)
    // So we only need to update once, but we'll update each to ensure consistency
    let successCount = 0;
    let errors = [];
    
    for (const event of futureEvents) {
      try {
        await ghlService.upsertAppointmentCustomObject(
          event.id,
          {
            pageUrl: customFields.pageUrl,
            coverImageUrl: customFields.coverImageUrl,
            downloadFileUrl: customFields.downloadFileUrl,
            internalNote: customFields.internalNote
          }
        );
        
        successCount++;
      } catch (error: any) {
        console.error(`❌ Failed to update event ${event.id}:`, error.message);
        errors.push({ eventId: event.id, error: error.message });
      }
    }
    
    // Set cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({
      success: true,
      updatedCount: successCount,
      totalEvents: futureEvents.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Error updating recurring series custom fields:', err);
    next(err);
  }
}

module.exports = { 
  listCalendars, getCalendarById, createCalendar, updateCalendar, deleteCalendar,
  // Groups
  getGroups, createCalendarGroup, editGroup, deleteGroup, disableGroup, validateGroupsSlug,
  // Appointments
  createAppointment, getAppointment, editAppointment, getAppointmentCustomFields, updateAppointmentCustomFields, updateRecurringSeriesCustomFields,
  // Events
  getCalendarEvents, getAllLocationEvents, deleteEvent,
  // Blocked Slots
  getBlockedSlots, createBlockSlot, editBlockSlot,
  // Slots
  getSlots,
  // Appointment Notes
  getAppointmentNotes, createAppointmentNote, updateAppointmentNote, deleteAppointmentNote,
  // Calendar Resources
  fetchCalendarResources, createCalendarResource, getCalendarResource, updateCalendarResource, deleteCalendarResource,
  // Event Notifications
  getEventNotification, createEventNotification, findEventNotification, updateEventNotification, deleteEventNotification
};