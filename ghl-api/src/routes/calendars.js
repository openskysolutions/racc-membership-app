const express = require('express');
const { 
  listCalendars, getCalendarById, createCalendar, updateCalendar, deleteCalendar,
  // Groups
  getGroups, createCalendarGroup, editGroup, deleteGroup, disableGroup, validateGroupsSlug,
  // Appointments
  createAppointment, getAppointment, editAppointment,
  // Events
  getCalendarEvents, deleteEvent,
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
} = require('../controllers/calendarsController');
const router = express.Router();

/**
 * @swagger
 * /calendars:
 *   get:
 *     summary: List all calendars for a location
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: Array of Calendar objects
 */
router.get('/', listCalendars);

/**
 * @swagger
 * /calendars/{id}:
 *   get:
 *     summary: Retrieve a calendar by ID
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Calendar object
 */
router.get('/:id', getCalendarById);

/**
 * @swagger
 * /calendars:
 *   post:
 *     summary: Create a new calendar
 *     tags:
 *       - Calendars
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Calendar created successfully
 */
router.post('/', createCalendar);

/**
 * @swagger
 * /calendars/{id}:
 *   put:
 *     summary: Update a calendar by ID
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Calendar updated successfully
 */
router.put('/:id', updateCalendar);

/**
 * @swagger
 * /calendars/{id}:
 *   delete:
 *     summary: Delete a calendar by ID
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Calendar deleted successfully
 */
router.delete('/:id', deleteCalendar);

// Calendar Groups
/**
 * @swagger
 * /calendars/groups:
 *   get:
 *     summary: Get all calendar groups for a location
 *     tags:
 *       - Calendars
 *     parameters:
 *       - $ref: '#/components/parameters/LocationId'
 *     responses:
 *       200:
 *         description: Array of calendar group objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/groups', getGroups);

/**
 * @swagger
 * /calendars/groups:
 *   post:
 *     summary: Create a new calendar group
 *     tags:
 *       - Calendars
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               locationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Calendar group created successfully
 */
router.post('/groups', createCalendarGroup);

/**
 * @swagger
 * /calendars/groups/{id}:
 *   put:
 *     summary: Edit a calendar group
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Calendar group updated successfully
 */
router.put('/groups/:id', editGroup);

/**
 * @swagger
 * /calendars/groups/{id}:
 *   delete:
 *     summary: Delete a calendar group
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Group ID
 *     responses:
 *       204:
 *         description: Calendar group deleted successfully
 */
router.delete('/groups/:id', deleteGroup);

/**
 * @swagger
 * /calendars/groups/{id}/disable:
 *   post:
 *     summary: Disable a calendar group
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Calendar group disabled successfully
 */
router.post('/groups/:id/disable', disableGroup);

/**
 * @swagger
 * /calendars/groups/validate/{slug}:
 *   get:
 *     summary: Validate a calendar group slug
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Slug to validate
 *     responses:
 *       200:
 *         description: Slug validation result
 */
router.get('/groups/validate/:slug', validateGroupsSlug);

// Appointments
/**
 * @swagger
 * /calendars/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags:
 *       - Calendars
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               calendarId:
 *                 type: string
 *               contactId:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Appointment created successfully
 */
router.post('/appointments', createAppointment);

/**
 * @swagger
 * /calendars/appointments/{id}:
 *   get:
 *     summary: Get an appointment by ID
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment object
 */
router.get('/appointments/:id', getAppointment);

/**
 * @swagger
 * /calendars/appointments/{id}:
 *   put:
 *     summary: Edit an appointment
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 */
router.put('/appointments/:id', editAppointment);

// Calendar Events
/**
 * @swagger
 * /calendars/{calendarId}/events:
 *   get:
 *     summary: Get all events for a calendar
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: calendarId
 *         schema:
 *           type: string
 *         required: true
 *         description: Calendar ID
 *     responses:
 *       200:
 *         description: Array of calendar events
 */
router.get('/:calendarId/events', getCalendarEvents);

/**
 * @swagger
 * /calendars/events/{id}:
 *   delete:
 *     summary: Delete a calendar event
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     responses:
 *       204:
 *         description: Event deleted successfully
 */
router.delete('/events/:id', deleteEvent);

// Blocked Slots
/**
 * @swagger
 * /calendars/{calendarId}/blocked-slots:
 *   get:
 *     summary: Get blocked slots for a calendar
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: calendarId
 *         schema:
 *           type: string
 *         required: true
 *         description: Calendar ID
 *     responses:
 *       200:
 *         description: Array of blocked slots
 */
router.get('/:calendarId/blocked-slots', getBlockedSlots);

/**
 * @swagger
 * /calendars/blocked-slots:
 *   post:
 *     summary: Create a blocked slot
 *     tags:
 *       - Calendars
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               calendarId:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Blocked slot created successfully
 */
router.post('/blocked-slots', createBlockSlot);

/**
 * @swagger
 * /calendars/blocked-slots/{id}:
 *   put:
 *     summary: Edit a blocked slot
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Slot ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Blocked slot updated successfully
 */
router.put('/blocked-slots/:id', editBlockSlot);

// Slots
/**
 * @swagger
 * /calendars/{calendarId}/slots:
 *   get:
 *     summary: Get available slots for a calendar
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: calendarId
 *         schema:
 *           type: string
 *         required: true
 *         description: Calendar ID
 *     responses:
 *       200:
 *         description: Array of available slots
 */
router.get('/:calendarId/slots', getSlots);

// Appointment Notes
/**
 * @swagger
 * /calendars/appointments/{appointmentId}/notes:
 *   get:
 *     summary: Get notes for an appointment
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Array of appointment notes
 */
router.get('/appointments/:appointmentId/notes', getAppointmentNotes);

/**
 * @swagger
 * /calendars/appointments/{appointmentId}/notes:
 *   post:
 *     summary: Create a note for an appointment
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               body:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment note created successfully
 */
router.post('/appointments/:appointmentId/notes', createAppointmentNote);

/**
 * @swagger
 * /calendars/appointments/{appointmentId}/notes/{noteId}:
 *   put:
 *     summary: Update an appointment note
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: noteId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Appointment note updated successfully
 */
router.put('/appointments/:appointmentId/notes/:noteId', updateAppointmentNote);

/**
 * @swagger
 * /calendars/appointments/{appointmentId}/notes/{noteId}:
 *   delete:
 *     summary: Delete an appointment note
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: noteId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Appointment note deleted successfully
 */
router.delete('/appointments/:appointmentId/notes/:noteId', deleteAppointmentNote);

// Calendar Resources
/**
 * @swagger
 * /calendars/{calendarId}/resources:
 *   get:
 *     summary: Fetch calendar resources
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: calendarId
 *         schema:
 *           type: string
 *         required: true
 *         description: Calendar ID
 *     responses:
 *       200:
 *         description: Array of calendar resources
 */
router.get('/:calendarId/resources', fetchCalendarResources);

/**
 * @swagger
 * /calendars/resources:
 *   post:
 *     summary: Create a calendar resource
 *     tags:
 *       - Calendars
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Calendar resource created successfully
 */
router.post('/resources', createCalendarResource);

/**
 * @swagger
 * /calendars/resources/{id}:
 *   get:
 *     summary: Get a calendar resource by ID
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Calendar resource object
 */
router.get('/resources/:id', getCalendarResource);

/**
 * @swagger
 * /calendars/resources/{id}:
 *   put:
 *     summary: Update a calendar resource
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Calendar resource updated successfully
 */
router.put('/resources/:id', updateCalendarResource);

/**
 * @swagger
 * /calendars/resources/{id}:
 *   delete:
 *     summary: Delete a calendar resource
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Resource ID
 *     responses:
 *       204:
 *         description: Calendar resource deleted successfully
 */
router.delete('/resources/:id', deleteCalendarResource);

// Event Notifications
/**
 * @swagger
 * /calendars/notifications/{id}:
 *   get:
 *     summary: Get an event notification
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Event notification object
 */
router.get('/notifications/:id', getEventNotification);

/**
 * @swagger
 * /calendars/notifications:
 *   post:
 *     summary: Create an event notification
 *     tags:
 *       - Calendars
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *               type:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Event notification created successfully
 */
router.post('/notifications', createEventNotification);

/**
 * @swagger
 * /calendars/events/{eventId}/notifications:
 *   get:
 *     summary: Find notifications for an event
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Array of event notifications
 */
router.get('/events/:eventId/notifications', findEventNotification);

/**
 * @swagger
 * /calendars/notifications/{id}:
 *   put:
 *     summary: Update an event notification
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event notification updated successfully
 */
router.put('/notifications/:id', updateEventNotification);

/**
 * @swagger
 * /calendars/notifications/{id}:
 *   delete:
 *     summary: Delete an event notification
 *     tags:
 *       - Calendars
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *     responses:
 *       204:
 *         description: Event notification deleted successfully
 */
router.delete('/notifications/:id', deleteEventNotification);

module.exports = router;