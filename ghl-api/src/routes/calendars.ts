import express from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';

const { 
  listCalendars, getCalendarById, createCalendar, updateCalendar, deleteCalendar,
  getGroups, createCalendarGroup, editGroup, deleteGroup, disableGroup, validateGroupsSlug,
  createAppointment, getAppointment, editAppointment, getAppointmentCustomFields, updateAppointmentCustomFields, updateRecurringSeriesCustomFields,
  getCalendarEvents, deleteEvent, getAllLocationEvents,
  getBlockedSlots, createBlockSlot, editBlockSlot,
  getSlots,
  getAppointmentNotes, createAppointmentNote, updateAppointmentNote, deleteAppointmentNote,
  fetchCalendarResources, createCalendarResource, getCalendarResource, updateCalendarResource, deleteCalendarResource,
  getEventNotification, createEventNotification, findEventNotification, updateEventNotification, deleteEventNotification
} = require('@/controllers/calendarsController');

const router = express.Router();

// Basic calendar routes
router.get('/', listCalendars);
router.get('/:id', getCalendarById);
router.post('/', requireAuth, createCalendar);
router.put('/:id', requireAuth, updateCalendar);
router.delete('/:id', requireAuth, deleteCalendar);

// Event routes
router.get('/events', getAllLocationEvents);
router.get('/:calendarId/events', getCalendarEvents);
router.delete('/events/:eventId', deleteEvent);

// Appointment routes
router.post('/appointments', requireAuth, createAppointment);
router.get('/appointments/:id', getAppointment);
router.put('/appointments/:id', requireAuth, editAppointment);
router.delete('/appointments/:id', requireAuth, deleteEvent); // Delete appointment (same as deleteEvent)
router.get('/appointments/:id/custom-fields', getAppointmentCustomFields); // Lazy load custom fields
router.post('/appointments/:id/custom-fields', requireAuth, updateAppointmentCustomFields); // Update only custom fields
router.post('/appointments/:id/recurring-series-custom-fields', requireAuth, updateRecurringSeriesCustomFields); // Update custom fields for entire recurring series

// Other routes can be added as needed...

export default router;
