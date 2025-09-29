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
    const result = await svc.createAppointment({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function getAppointment(req, res, next) {
  try {
    const result = await svc.getAppointment({ appointmentId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function editAppointment(req, res, next) {
  try {
    const result = await svc.editAppointment({ appointmentId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Calendar Events
async function getCalendarEvents(req, res, next) {
  try {
    console.log('Getting calendar events for calendarId:', req.params.calendarId);
    console.log('Query params:', req.query);
    
    const calendarId = req.params.calendarId;
    const { startDate, endDate } = req.query;
    
    // Parse date parameters if provided
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    // Use our custom GoHighLevel service instead of the SDK
    const events = await ghlService.getCalendarEvents(calendarId, start, end);
    
    console.log(`Retrieved ${events.length} events from GoHighLevel service`);
    
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
    console.log('Getting all events for location');
    console.log('Query params:', req.query);
    
    const { startDate, endDate } = req.query;
    
    // Parse date parameters if provided
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    // Use our custom GoHighLevel service without specific calendar ID
    const events = await ghlService.getCalendarEvents(null, start, end);
    
    console.log(`Retrieved ${events.length} events from GoHighLevel service (all calendars)`);
    
    // Return the events array directly
    res.json(events);
  } catch (err) { 
    console.error('Error in getAllLocationEvents:', err);
    next(err); 
  }
}

async function deleteEvent(req, res, next) {
  try {
    await svc.deleteEvent({ eventId: req.params.id }, { headers: req.headers });
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

async function validateGroupsSlug(req, res, next) {
  try {
    const result = await svc.validateGroupsSlug({ slug: req.params.slug }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { 
  listCalendars, getCalendarById, createCalendar, updateCalendar, deleteCalendar,
  // Groups
  getGroups, createCalendarGroup, editGroup, deleteGroup, disableGroup, validateGroupsSlug,
  // Appointments
  createAppointment, getAppointment, editAppointment,
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