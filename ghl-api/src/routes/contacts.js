const express = require('express');
const { 
  searchContactsAdvanced, 
  membersList,
  getDuplicateContact,
  getContactById,
  getAllTasks, 
  createTask, 
  getTask, 
  updateTask, 
  deleteTask,
  getAppointmentsForContact,
  addTags,
  removeTags,
  getAllNotes,
  createNote,
  getNote,
  updateNote,
  deleteNote,
  upsertContact,
  getContactsByBusinessId,
  addFollowersContact,
  removeFollowersContact,
  createAssociation,
  addRemoveContactFromBusiness,
  addContactToCampaign,
  removeContactFromCampaign,
  removeContactFromEveryCampaign,
  addContactToWorkflow,
  deleteContactToWorkflow
} = require('../controllers/contactsController');
const router = express.Router();

/**
 * @swagger
 * /contacts/searchContactsAdvanced:
 *   post:
 *     summary: Search contacts based on advanced filters
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Array of Contact objects
 */
router.post('/searchContactsAdvanced', searchContactsAdvanced);

/**
 * @swagger
 * /contacts/searchContacts:
 *   post:
 *     summary: Search contacts
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Array of Contact objects
 */
router.post('/membersList', membersList);

/**
 * @swagger
 * /contacts/getDuplicateContact:
 *   get:
 *     summary: Retrieve duplicate contact by number or email
 *     tags:
 *       - Contacts
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: number
 *         schema:
 *           type: string
 *         required: false
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: Contact object
 */
router.get('/getDuplicateContact', getDuplicateContact);

/**
 * @swagger
 * /contacts/{contactId}:
 *   get:
 *     summary: Get contact by ID
 *     tags:
 *       - Contacts
 *     parameters:
 *       - in: path
 *         name: contactId
 *         schema:
 *           type: string
 *         required: true
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/:contactId', getContactById);

/**
 * @swagger
 * /contacts/getAllTasks:
 *   get:
 *     summary: Get all tasks for a contact
 *     tags:
 *       - Contacts
 *     parameters:
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Array of Task objects
 */
router.get('/getAllTasks', getAllTasks);

/**
 * @swagger
 * /contacts/createTask:
 *   post:
 *     summary: Create a new task for a contact
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post('/createTask', createTask);

/**
 * @swagger
 * /contacts/getTask:
 *   get:
 *     summary: Get a task by ID
 *     tags:
 *       - Contacts
 *     parameters:
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Task object
 */
router.get('/getTask', getTask);

/**
 * @swagger
 * /contacts/updateTask:
 *   put:
 *     summary: Update a task by ID
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Task updated successfully
 */
router.put('/updateTask', updateTask);

/**
 * @swagger
 * /contacts/deleteTask:
 *   delete:
 *     summary: Delete a task by ID
 *     tags:
 *       - Contacts
 *     parameters:
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Task deleted successfully
 */
router.delete('/deleteTask', deleteTask);

/**
 * @swagger
 * /contacts/getAppointmentsForContact:
 *   get:
 *     summary: Get all appointments for a contact
 *     tags:
 *       - Contacts
 *     parameters:
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: string
 *         required: true
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Array of appointment objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/getAppointmentsForContact', getAppointmentsForContact);

/**
 * @swagger
 * /contacts/addTags:
 *   post:
 *     summary: Add tags to a contact
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tags added successfully
 */
router.post('/addTags', addTags);

/**
 * @swagger
 * /contacts/removeTags:
 *   post:
 *     summary: Remove tags from a contact
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Tags removed successfully
 */
router.post('/removeTags', removeTags);

/**
 * @swagger
 * /contacts/getAllNotes:
 *   get:
 *     summary: Get all notes for a contact
 *     tags:
 *       - Contacts
 *     parameters:
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Array of note objects
 */
router.get('/getAllNotes', getAllNotes);

/**
 * @swagger
 * /contacts/createNote:
 *   post:
 *     summary: Create a note for a contact
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note created successfully
 */
router.post('/createNote', createNote);

/**
 * @swagger
 * /contacts/getNote:
 *   get:
 *     summary: Get a specific note
 *     tags:
 *       - Contacts
 *     parameters:
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Note object
 */
router.get('/getNote', getNote);

/**
 * @swagger
 * /contacts/updateNote:
 *   put:
 *     summary: Update a note
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               id:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note updated successfully
 */
router.put('/updateNote', updateNote);

/**
 * @swagger
 * /contacts/deleteNote:
 *   delete:
 *     summary: Delete a note
 *     tags:
 *       - Contacts
 *     parameters:
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Note deleted successfully
 */
router.delete('/deleteNote', deleteNote);

/**
 * @swagger
 * /contacts/upsertContact:
 *   post:
 *     summary: Create or update a contact
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Contact upserted successfully
 */
router.post('/upsertContact', upsertContact);

/**
 * @swagger
 * /contacts/getContactsByBusinessId:
 *   get:
 *     summary: Get contacts by business ID
 *     tags:
 *       - Contacts
 *     parameters:
 *       - in: query
 *         name: businessId
 *         schema:
 *           type: string
 *         required: true
 *       - $ref: '#/components/parameters/Limit'
 *       - $ref: '#/components/parameters/Skip'
 *     responses:
 *       200:
 *         description: Array of contact objects
 */
router.get('/getContactsByBusinessId', getContactsByBusinessId);

/**
 * @swagger
 * /contacts/addFollowersContact:
 *   post:
 *     summary: Add followers to a contact
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               followers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Followers added successfully
 */
router.post('/addFollowersContact', addFollowersContact);

/**
 * @swagger
 * /contacts/removeFollowersContact:
 *   post:
 *     summary: Remove followers from a contact
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               followers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Followers removed successfully
 */
router.post('/removeFollowersContact', removeFollowersContact);

/**
 * @swagger
 * /contacts/createAssociation:
 *   post:
 *     summary: Create an association for a contact
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Association created successfully
 */
router.post('/createAssociation', createAssociation);

/**
 * @swagger
 * /contacts/addRemoveContactFromBusiness:
 *   post:
 *     summary: Add or remove contact from business
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Operation completed successfully
 */
router.post('/addRemoveContactFromBusiness', addRemoveContactFromBusiness);

/**
 * @swagger
 * /contacts/addContactToCampaign:
 *   post:
 *     summary: Add contact to a campaign
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               campaignId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact added to campaign successfully
 */
router.post('/addContactToCampaign', addContactToCampaign);

/**
 * @swagger
 * /contacts/removeContactFromCampaign:
 *   post:
 *     summary: Remove contact from a campaign
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               campaignId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact removed from campaign successfully
 */
router.post('/removeContactFromCampaign', removeContactFromCampaign);

/**
 * @swagger
 * /contacts/removeContactFromEveryCampaign:
 *   post:
 *     summary: Remove contact from all campaigns
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact removed from all campaigns successfully
 */
router.post('/removeContactFromEveryCampaign', removeContactFromEveryCampaign);

/**
 * @swagger
 * /contacts/addContactToWorkflow:
 *   post:
 *     summary: Add contact to a workflow
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               workflowId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact added to workflow successfully
 */
router.post('/addContactToWorkflow', addContactToWorkflow);

/**
 * @swagger
 * /contacts/deleteContactToWorkflow:
 *   post:
 *     summary: Remove contact from a workflow
 *     tags:
 *       - Contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               workflowId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact removed from workflow successfully
 */
router.post('/deleteContactToWorkflow', deleteContactToWorkflow);

module.exports = router;