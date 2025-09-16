const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.customFields;

async function listCustomFields(req, res, next) {
  try {
    const result = await svc.getCustomFieldsByObjectKey({ objectKey: req.query.objectKey || 'contact' }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getCustomFieldById(req, res, next) {
  try {
    const result = await svc.getCustomFieldById({ customFieldId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createCustomField(req, res, next) {
  try {
    const result = await svc.createCustomField({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateCustomField(req, res, next) {
  try {
    const result = await svc.updateCustomField({ customFieldId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteCustomField(req, res, next) {
  try {
    await svc.deleteCustomField({ customFieldId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Custom Field Folders
async function createCustomFieldFolder(req, res, next) {
  try {
    const result = await svc.createCustomFieldFolder({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateCustomFieldFolder(req, res, next) {
  try {
    const result = await svc.updateCustomFieldFolder({ folderId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteCustomFieldFolder(req, res, next) {
  try {
    await svc.deleteCustomFieldFolder({ folderId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { 
  listCustomFields, getCustomFieldById, createCustomField, updateCustomField, deleteCustomField,
  // Folder management
  createCustomFieldFolder, updateCustomFieldFolder, deleteCustomFieldFolder
};