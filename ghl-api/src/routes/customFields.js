const express = require('express');
const { listCustomFields, getCustomFieldById, createCustomField, updateCustomField, deleteCustomField } = require('../controllers/customFieldsController');
const router = express.Router();

/**
 * @swagger
 * /customFields:
 *   get:
 *     summary: List custom field definitions
 *     tags:
 *       - CustomFields
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of CustomField objects
 */
router.get('/', listCustomFields);

/**
 * @swagger
 * /customFields/{id}:
 *   get:
 *     summary: Retrieve a custom field by ID
 *     tags:
 *       - CustomFields
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: CustomField object
 */
router.get('/:id', getCustomFieldById);

/**
 * @swagger
 * /customFields:
 *   post:
 *     summary: Create a new custom field definition
 *     tags:
 *       - CustomFields
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: CustomField created successfully
 */
router.post('/', createCustomField);

/**
 * @swagger
 * /customFields/{id}:
 *   put:
 *     summary: Update a custom field definition by ID
 *     tags:
 *       - CustomFields
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
 *         description: CustomField updated successfully
 */
router.put('/:id', updateCustomField);

/**
 * @swagger
 * /customFields/{id}:
 *   delete:
 *     summary: Delete a custom field definition by ID
 *     tags:
 *       - CustomFields
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: CustomField deleted successfully
 */
router.delete('/:id', deleteCustomField);

module.exports = router;