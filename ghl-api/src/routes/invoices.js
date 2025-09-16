const express = require('express');
const { 
  listInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice,
  // Invoice Templates
  createInvoiceTemplate, listInvoiceTemplates, getInvoiceTemplate, updateInvoiceTemplate, deleteInvoiceTemplate,
  // Invoice Configuration
  updateInvoiceTemplateLateFeesConfiguration, updateInvoicePaymentMethodsConfiguration, updateInvoiceLateFeesConfiguration,
  // Invoice Schedules
  createInvoiceSchedule, listInvoiceSchedules, getInvoiceSchedule, updateInvoiceSchedule, deleteInvoiceSchedule,
  // Invoice Schedule Operations
  updateAndScheduleInvoiceSchedule, scheduleInvoiceSchedule, autoPaymentInvoiceSchedule, cancelInvoiceSchedule,
  // Invoice Operations
  text2payInvoice, generateInvoiceNumber, voidInvoice, sendInvoice, recordInvoice, updateInvoiceLastVisitedAt,
  // Estimates
  createNewEstimate, updateEstimate, deleteEstimate, generateEstimateNumber, sendEstimate, createInvoiceFromEstimate, 
  listEstimates, updateEstimateLastVisitedAt,
  // Estimate Templates
  listEstimateTemplates, createEstimateTemplate, updateEstimateTemplate, deleteEstimateTemplate, previewEstimateTemplate
} = require('../controllers/invoicesController');
const router = express.Router();

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: List all invoices
 *     tags:
 *       - Invoices
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
 *         description: Array of Invoice objects
 */
router.get('/', listInvoices);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Retrieve an invoice by ID
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Invoice object
 */
router.get('/:id', getInvoiceById);

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags:
 *       - Invoices
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Invoice created successfully
 */
router.post('/', createInvoice);

/**
 * @swagger
 * /invoices/{id}:
 *   put:
 *     summary: Update an invoice by ID
 *     tags:
 *       - Invoices
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
 *         description: Invoice updated successfully
 */
router.put('/:id', updateInvoice);

/**
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     summary: Delete an invoice by ID
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Invoice deleted successfully
 */
router.delete('/:id', deleteInvoice);

// Invoice Templates
/**
 * @swagger
 * /invoices/templates:
 *   get:
 *     summary: List all invoice templates
 *     tags:
 *       - Invoices
 *     parameters:
 *       - $ref: '#/components/parameters/LocationId'
 *       - $ref: '#/components/parameters/Limit'
 *       - $ref: '#/components/parameters/Skip'
 *     responses:
 *       200:
 *         description: Array of invoice template objects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/templates', listInvoiceTemplates);

/**
 * @swagger
 * /invoices/templates:
 *   post:
 *     summary: Create a new invoice template
 *     tags:
 *       - Invoices
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: number
 *     responses:
 *       201:
 *         description: Invoice template created successfully
 */
router.post('/templates', createInvoiceTemplate);

/**
 * @swagger
 * /invoices/templates/{id}:
 *   get:
 *     summary: Get an invoice template by ID
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Invoice template object
 */
router.get('/templates/:id', getInvoiceTemplate);

/**
 * @swagger
 * /invoices/templates/{id}:
 *   put:
 *     summary: Update an invoice template
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Invoice template updated successfully
 */
router.put('/templates/:id', updateInvoiceTemplate);

/**
 * @swagger
 * /invoices/templates/{id}:
 *   delete:
 *     summary: Delete an invoice template
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Template ID
 *     responses:
 *       204:
 *         description: Invoice template deleted successfully
 */
router.delete('/templates/:id', deleteInvoiceTemplate);

// Invoice Schedules
/**
 * @swagger
 * /invoices/schedules:
 *   get:
 *     summary: Get all invoice schedules
 *     tags:
 *       - Invoices
 *     parameters:
 *       - $ref: '#/components/parameters/LocationId'
 *     responses:
 *       200:
 *         description: Array of invoice schedule objects
 */
router.get('/schedules', listInvoiceSchedules);

/**
 * @swagger
 * /invoices/schedules:
 *   post:
 *     summary: Create an invoice schedule
 *     tags:
 *       - Invoices
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               frequency:
 *                 type: string
 *                 enum: [weekly, monthly, quarterly, annually]
 *               startDate:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Invoice schedule created successfully
 */
router.post('/schedules', createInvoiceSchedule);

/**
 * @swagger
 * /invoices/schedules/{id}:
 *   get:
 *     summary: Get an invoice schedule by ID
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Invoice schedule object
 */
router.get('/schedules/:id', getInvoiceSchedule);

/**
 * @swagger
 * /invoices/schedules/{id}:
 *   put:
 *     summary: Update an invoice schedule
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Invoice schedule updated successfully
 */
router.put('/schedules/:id', updateInvoiceSchedule);

/**
 * @swagger
 * /invoices/schedules/{id}:
 *   delete:
 *     summary: Delete an invoice schedule
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Schedule ID
 *     responses:
 *       204:
 *         description: Invoice schedule deleted successfully
 */
router.delete('/schedules/:id', deleteInvoiceSchedule);

// Invoice Operations
/**
 * @swagger
 * /invoices/generate-number:
 *   post:
 *     summary: Generate a new invoice number
 *     tags:
 *       - Invoices
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               locationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated invoice number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceNumber:
 *                   type: string
 */
router.post('/generate-number', generateInvoiceNumber);

/**
 * @swagger
 * /invoices/{id}/send:
 *   post:
 *     summary: Send an invoice to customer
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [email, sms]
 *     responses:
 *       200:
 *         description: Invoice sent successfully
 */
router.post('/:id/send', sendInvoice);

/**
 * @swagger
 * /invoices/{id}/void:
 *   post:
 *     summary: Void an invoice
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice voided successfully
 */
router.post('/:id/void', voidInvoice);

/**
 * @swagger
 * /invoices/{id}/payments:
 *   post:
 *     summary: Record a payment for an invoice
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 */
router.post('/:id/payments', recordInvoice);

// Estimates
/**
 * @swagger
 * /invoices/estimates:
 *   get:
 *     summary: List all estimates
 *     tags:
 *       - Invoices
 *     parameters:
 *       - $ref: '#/components/parameters/LocationId'
 *       - $ref: '#/components/parameters/Limit'
 *       - $ref: '#/components/parameters/Skip'
 *     responses:
 *       200:
 *         description: Array of estimate objects
 */
router.get('/estimates', listEstimates);

/**
 * @swagger
 * /invoices/estimates:
 *   post:
 *     summary: Create a new estimate
 *     tags:
 *       - Invoices
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               contactId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Estimate created successfully
 */
router.post('/estimates', createNewEstimate);

/**
 * @swagger
 * /invoices/estimates/{id}:
 *   get:
 *     summary: Get an estimate by ID
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Estimate ID
 *     responses:
 *       200:
 *         description: Estimate object
 */
// Note: getEstimate function doesn't exist in controller, so this route is commented out
// router.get('/estimates/:id', getEstimate);

/**
 * @swagger
 * /invoices/estimates/{id}:
 *   put:
 *     summary: Update an estimate
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Estimate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Estimate updated successfully
 */
router.put('/estimates/:id', updateEstimate);

/**
 * @swagger
 * /invoices/estimates/{id}:
 *   delete:
 *     summary: Delete an estimate
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Estimate ID
 *     responses:
 *       204:
 *         description: Estimate deleted successfully
 */
router.delete('/estimates/:id', deleteEstimate);

/**
 * @swagger
 * /invoices/estimates/{id}/send:
 *   post:
 *     summary: Send an estimate to customer
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Estimate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contactId:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [email, sms]
 *     responses:
 *       200:
 *         description: Estimate sent successfully
 */
router.post('/estimates/:id/send', sendEstimate);

// Estimate Schedules - These functions don't exist in the controller, so commenting out
/*
router.get('/estimate-schedules', getEstimateSchedules);
router.post('/estimate-schedules', createEstimateSchedule);
router.get('/estimate-schedules/:id', getEstimateSchedule);
router.put('/estimate-schedules/:id', updateEstimateSchedule);
router.delete('/estimate-schedules/:id', deleteEstimateSchedule);
*/

// Payment Methods - These functions don't exist in the controller, so commenting out
/*
router.post('/payment-methods', createPaymentMethod);
router.delete('/payment-methods/:id', deletePaymentMethod);
*/

// Late Fees - This function doesn't exist in the controller, so commenting out
/*
router.post('/:id/late-fee', addLateFee);
*/

module.exports = router;