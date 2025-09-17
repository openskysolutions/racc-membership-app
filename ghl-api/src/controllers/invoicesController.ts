const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.invoices;

async function listInvoices(req, res, next) {
  try {
    const params = { limit: req.query.limit, skip: req.query.skip, locationId: req.query.locationId || process.env.LOCATION_ID };
    const result = await svc.listInvoices(params, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getInvoiceById(req, res, next) {
  try {
    const result = await svc.getInvoice({ invoiceId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createInvoice(req, res, next) {
  try {
    const result = await svc.createInvoice({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateInvoice(req, res, next) {
  try {
    const result = await svc.updateInvoice({ invoiceId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteInvoice(req, res, next) {
  try {
    await svc.deleteInvoice({ invoiceId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Invoice Templates
async function createInvoiceTemplate(req, res, next) {
  try {
    const result = await svc.createInvoiceTemplate({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function listInvoiceTemplates(req, res, next) {
  try {
    const result = await svc.listInvoiceTemplates({ locationId: req.query.locationId || process.env.LOCATION_ID }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getInvoiceTemplate(req, res, next) {
  try {
    const result = await svc.getInvoiceTemplate({ templateId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function updateInvoiceTemplate(req, res, next) {
  try {
    const result = await svc.updateInvoiceTemplate({ templateId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteInvoiceTemplate(req, res, next) {
  try {
    await svc.deleteInvoiceTemplate({ templateId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Invoice Configuration
async function updateInvoiceTemplateLateFeesConfiguration(req, res, next) {
  try {
    const result = await svc.updateInvoiceTemplateLateFeesConfiguration({ templateId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function updateInvoicePaymentMethodsConfiguration(req, res, next) {
  try {
    const result = await svc.updateInvoicePaymentMethodsConfiguration({ templateId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function updateInvoiceLateFeesConfiguration(req, res, next) {
  try {
    const result = await svc.updateInvoiceLateFeesConfiguration({ invoiceId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Invoice Schedules
async function createInvoiceSchedule(req, res, next) {
  try {
    const result = await svc.createInvoiceSchedule({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function listInvoiceSchedules(req, res, next) {
  try {
    const result = await svc.listInvoiceSchedules({ locationId: req.query.locationId || process.env.LOCATION_ID }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getInvoiceSchedule(req, res, next) {
  try {
    const result = await svc.getInvoiceSchedule({ scheduleId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function updateInvoiceSchedule(req, res, next) {
  try {
    const result = await svc.updateInvoiceSchedule({ scheduleId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteInvoiceSchedule(req, res, next) {
  try {
    await svc.deleteInvoiceSchedule({ scheduleId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Invoice Schedule Operations
async function updateAndScheduleInvoiceSchedule(req, res, next) {
  try {
    const result = await svc.updateAndScheduleInvoiceSchedule({ scheduleId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function scheduleInvoiceSchedule(req, res, next) {
  try {
    const result = await svc.scheduleInvoiceSchedule({ scheduleId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function autoPaymentInvoiceSchedule(req, res, next) {
  try {
    const result = await svc.autoPaymentInvoiceSchedule({ scheduleId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function cancelInvoiceSchedule(req, res, next) {
  try {
    const result = await svc.cancelInvoiceSchedule({ scheduleId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Invoice Operations
async function text2payInvoice(req, res, next) {
  try {
    const result = await svc.text2payInvoice({ invoiceId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function generateInvoiceNumber(req, res, next) {
  try {
    const result = await svc.generateInvoiceNumber({ locationId: req.query.locationId || process.env.LOCATION_ID }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function voidInvoice(req, res, next) {
  try {
    const result = await svc.voidInvoice({ invoiceId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function sendInvoice(req, res, next) {
  try {
    const result = await svc.sendInvoice({ invoiceId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function recordInvoice(req, res, next) {
  try {
    const result = await svc.recordInvoice({ invoiceId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function updateInvoiceLastVisitedAt(req, res, next) {
  try {
    const result = await svc.updateInvoiceLastVisitedAt({ invoiceId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Estimates
async function createNewEstimate(req, res, next) {
  try {
    const result = await svc.createNewEstimate({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateEstimate(req, res, next) {
  try {
    const result = await svc.updateEstimate({ estimateId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteEstimate(req, res, next) {
  try {
    await svc.deleteEstimate({ estimateId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

async function generateEstimateNumber(req, res, next) {
  try {
    const result = await svc.generateEstimateNumber({ locationId: req.query.locationId || process.env.LOCATION_ID }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function sendEstimate(req, res, next) {
  try {
    const result = await svc.sendEstimate({ estimateId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createInvoiceFromEstimate(req, res, next) {
  try {
    const result = await svc.createInvoiceFromEstimate({ estimateId: req.params.id, payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function listEstimates(req, res, next) {
  try {
    const result = await svc.listEstimates({ locationId: req.query.locationId || process.env.LOCATION_ID }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function updateEstimateLastVisitedAt(req, res, next) {
  try {
    const result = await svc.updateEstimateLastVisitedAt({ estimateId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Estimate Templates
async function listEstimateTemplates(req, res, next) {
  try {
    const result = await svc.listEstimateTemplates({ locationId: req.query.locationId || process.env.LOCATION_ID }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createEstimateTemplate(req, res, next) {
  try {
    const result = await svc.createEstimateTemplate({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateEstimateTemplate(req, res, next) {
  try {
    const result = await svc.updateEstimateTemplate({ templateId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteEstimateTemplate(req, res, next) {
  try {
    await svc.deleteEstimateTemplate({ templateId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

async function previewEstimateTemplate(req, res, next) {
  try {
    const result = await svc.previewEstimateTemplate({ templateId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { 
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
};