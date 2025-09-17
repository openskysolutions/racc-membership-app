const express = require('express');
const { listEmails, getEmailById, createEmail, updateEmail, deleteEmail } = require('@/controllers/emailsController');
const router = express.Router();

/**
 * @swagger
 * /emails:
 *   get:
 *     summary: List all emails
 *     tags:
 *       - Emails
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of Email objects
 */
router.get('/', listEmails);

/**
 * @swagger
 * /emails/{id}:
 *   get:
 *     summary: Retrieve an email by ID
 *     tags:
 *       - Emails
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Email object
 */
router.get('/:id', getEmailById);

/**
 * @swagger
 * /emails:
 *   post:
 *     summary: Create a new email
 *     tags:
 *       - Emails
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Email created successfully
 */
router.post('/', createEmail);

/**
 * @swagger
 * /emails/{id}:
 *   put:
 *     summary: Update an email by ID
 *     tags:
 *       - Emails
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
 *         description: Email updated successfully
 */
router.put('/:id', updateEmail);

/**
 * @swagger
 * /emails/{id}:
 *   delete:
 *     summary: Delete an email by ID
 *     tags:
 *       - Emails
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Email deleted successfully
 */
router.delete('/:id', deleteEmail);

module.exports = router;