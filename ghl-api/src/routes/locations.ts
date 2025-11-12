const express = require('express');
const { 
  listLocations, getLocationById, createLocation, updateLocation, deleteLocation,
  // Tags
  getLocationTags, createTag, getTagById, updateTag, deleteTag,
  // Task Search
  taskSearch,
  // Custom Fields
  getCustomFields, createCustomField, getCustomField, updateCustomField, deleteCustomField, uploadFileCustomFields,
  // Custom Values
  getCustomValues, createCustomValue, getCustomValue, updateCustomValue, deleteCustomValue,
  // Timezones
  getTimezones,
  // Templates
  getAllOrEmailSmsTemplates, deleteAnEmailSmsTemplate,
  // Test Connection
  testConnection,
  // Current Location
  getCurrentLocation
} = require('@/controllers/locationsController');
const router = express.Router();

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: List all locations
 *     tags:
 *       - Locations
 *     parameters:
 *       - $ref: '#/components/parameters/Limit'
 *       - $ref: '#/components/parameters/Skip'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for location name or address
 *     responses:
 *       200:
 *         description: Array of location objects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /locations/current:
 *   get:
 *     summary: Get the configured location (from LOCATION_ID environment variable)
 *     tags:
 *       - Locations
 *     responses:
 *       200:
 *         description: Location information object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 location:
 *                   type: object
 */
router.get('/current', getCurrentLocation);

router.get('/', listLocations);

/**
 * @swagger
 * /locations/{id}:
 *   get:
 *     summary: Get a location by ID
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 address:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 email:
 *                   type: string
 *                 timezone:
 *                   type: string
 */
router.get('/:id', getLocationById);

/**
 * @swagger
 * /locations:
 *   post:
 *     summary: Create a new location
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               timezone:
 *                 type: string
 *               businessType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Location created successfully
 */
router.post('/', createLocation);

/**
 * @swagger
 * /locations/{id}:
 *   put:
 *     summary: Update a location
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Location updated successfully
 */
router.put('/:id', updateLocation);

/**
 * @swagger
 * /locations/{id}:
 *   delete:
 *     summary: Delete a location
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Location ID
 *     responses:
 *       204:
 *         description: Location deleted successfully
 */
router.delete('/:id', deleteLocation);

// Location Tags
/**
 * @swagger
 * /locations/tags:
 *   get:
 *     summary: Get location tags
 *     tags:
 *       - Locations
 *     parameters:
 *       - $ref: '#/components/parameters/LocationId'
 *     responses:
 *       200:
 *         description: Array of tag objects
 */
router.get('/tags', getLocationTags);

/**
 * @swagger
 * /locations/tags:
 *   post:
 *     summary: Create a new tag
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tag created successfully
 */
router.post('/tags', createTag);

/**
 * @swagger
 * /locations/tags/{id}:
 *   get:
 *     summary: Get a tag by ID
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Tag ID
 *     responses:
 *       200:
 *         description: Tag object
 */
router.get('/tags/:id', getTagById);

/**
 * @swagger
 * /locations/tags/{id}:
 *   put:
 *     summary: Update a tag
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Tag ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Tag updated successfully
 */
router.put('/tags/:id', updateTag);

/**
 * @swagger
 * /locations/tags/{id}:
 *   delete:
 *     summary: Delete a tag
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Tag ID
 *     responses:
 *       204:
 *         description: Tag deleted successfully
 */
router.delete('/tags/:id', deleteTag);

// Task Search
/**
 * @swagger
 * /locations/tasks/search:
 *   get:
 *     summary: Search tasks by location
 *     tags:
 *       - Locations
 *     parameters:
 *       - $ref: '#/components/parameters/LocationId'
 *     responses:
 *       200:
 *         description: Array of task objects
 */
router.get('/tasks/search', taskSearch);

// Custom Fields
/**
 * @swagger
 * /locations/custom-fields:
 *   get:
 *     summary: Get custom fields for location
 *     tags:
 *       - Locations
 *     parameters:
 *       - $ref: '#/components/parameters/LocationId'
 *     responses:
 *       200:
 *         description: Array of custom field objects
 */
router.get('/custom-fields', getCustomFields);

/**
 * @swagger
 * /locations/custom-fields:
 *   post:
 *     summary: Create a custom field
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               fieldType:
 *                 type: string
 *               options:
 *                 type: array
 *     responses:
 *       201:
 *         description: Custom field created successfully
 */
router.post('/custom-fields', createCustomField);

/**
 * @swagger
 * /locations/custom-fields/{id}:
 *   get:
 *     summary: Get a custom field by ID
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom field ID
 *     responses:
 *       200:
 *         description: Custom field object
 */
router.get('/custom-fields/:id', getCustomField);

/**
 * @swagger
 * /locations/custom-fields/{id}:
 *   put:
 *     summary: Update a custom field
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom field ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Custom field updated successfully
 */
router.put('/custom-fields/:id', updateCustomField);

/**
 * @swagger
 * /locations/custom-fields/{id}:
 *   delete:
 *     summary: Delete a custom field
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom field ID
 *     responses:
 *       204:
 *         description: Custom field deleted successfully
 */
router.delete('/custom-fields/:id', deleteCustomField);

/**
 * @swagger
 * /locations/custom-fields/upload:
 *   post:
 *     summary: Upload file for custom fields
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */
router.post('/custom-fields/upload', uploadFileCustomFields);

// Custom Values
/**
 * @swagger
 * /locations/custom-values:
 *   get:
 *     summary: Get custom values for location
 *     tags:
 *       - Locations
 *     parameters:
 *       - $ref: '#/components/parameters/LocationId'
 *     responses:
 *       200:
 *         description: Array of custom value objects
 */
router.get('/custom-values', getCustomValues);

/**
 * @swagger
 * /locations/custom-values:
 *   post:
 *     summary: Create a custom value
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customFieldId:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       201:
 *         description: Custom value created successfully
 */
router.post('/custom-values', createCustomValue);

/**
 * @swagger
 * /locations/custom-values/{id}:
 *   get:
 *     summary: Get a custom value by ID
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom value ID
 *     responses:
 *       200:
 *         description: Custom value object
 */
router.get('/custom-values/:id', getCustomValue);

/**
 * @swagger
 * /locations/custom-values/{id}:
 *   put:
 *     summary: Update a custom value
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom value ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Custom value updated successfully
 */
router.put('/custom-values/:id', updateCustomValue);

/**
 * @swagger
 * /locations/custom-values/{id}:
 *   delete:
 *     summary: Delete a custom value
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom value ID
 *     responses:
 *       204:
 *         description: Custom value deleted successfully
 */
router.delete('/custom-values/:id', deleteCustomValue);

// Timezones
/**
 * @swagger
 * /locations/timezones:
 *   get:
 *     summary: Get available timezones
 *     tags:
 *       - Locations
 *     responses:
 *       200:
 *         description: Array of timezone objects
 */
router.get('/timezones', getTimezones);

// Email/SMS Templates
/**
 * @swagger
 * /locations/templates:
 *   get:
 *     summary: Get all email/SMS templates
 *     tags:
 *       - Locations
 *     parameters:
 *       - $ref: '#/components/parameters/LocationId'
 *     responses:
 *       200:
 *         description: Array of template objects
 */
router.get('/templates', getAllOrEmailSmsTemplates);

/**
 * @swagger
 * /locations/templates/{id}:
 *   delete:
 *     summary: Delete an email/SMS template
 *     tags:
 *       - Locations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Template ID
 *     responses:
 *       204:
 *         description: Template deleted successfully
 */
router.delete('/templates/:id', deleteAnEmailSmsTemplate);

/**
 * @swagger
 * /locations/test-connection:
 *   get:
 *     summary: Test GoHighLevel API connection
 *     tags:
 *       - Locations
 *     parameters:
 *       - $ref: '#/components/parameters/LocationId'
 *     responses:
 *       200:
 *         description: API connection test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 calendarsFound:
 *                   type: integer
 *                 locationId:
 *                   type: string
 *                 tokenType:
 *                   type: string
 *       500:
 *         description: API connection test failed
 */
router.get('/test-connection', testConnection);

module.exports = router;