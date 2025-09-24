const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.emails;

async function listEmails(req, res, next) {
  try {
    // The API has fetchCampaigns, not a general email list method
    const result = await svc.fetchCampaigns({ locationId: req.query.locationId || process.env.LOCATION_ID }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getEmailById(req, res, next) {
  try {
    // Use fetchTemplate for individual email template
    const result = await svc.fetchTemplate({ templateId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createEmail(req, res, next) {
  try {
    // Use createTemplate for creating email templates
    const result = await svc.createTemplate({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateEmail(req, res, next) {
  try {
    // Use updateTemplate for updating email templates
    const result = await svc.updateTemplate({ templateId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteEmail(req, res, next) {
  try {
    // Use deleteTemplate for deleting email templates
    await svc.deleteTemplate({ templateId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { listEmails, getEmailById, createEmail, updateEmail, deleteEmail };