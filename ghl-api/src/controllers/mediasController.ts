const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.medias;

async function listMedias(req, res, next) {
  try {
    // No list method available - use fetchMediaContent for specific media
    res.status(405).json({ message: 'List medias method not available. Use fetchMediaContent for specific media.' });
  } catch (err) { next(err); }
}

async function getMediaById(req, res, next) {
  try {
    const result = await svc.fetchMediaContent({ mediaId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createMedia(req, res, next) {
  try {
    const result = await svc.uploadMediaContent({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateMedia(req, res, next) {
  try {
    const result = await svc.updateMediaObject({ mediaId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteMedia(req, res, next) {
  try {
    await svc.deleteMediaContent({ mediaId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Media Folders
async function createMediaFolder(req, res, next) {
  try {
    const result = await svc.createMediaFolder({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

// Bulk Operations
async function bulkUpdateMediaObjects(req, res, next) {
  try {
    const result = await svc.bulkUpdateMediaObjects({ payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function bulkDeleteMediaObjects(req, res, next) {
  try {
    const result = await svc.bulkDeleteMediaObjects({ payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { 
  listMedias, getMediaById, createMedia, updateMedia, deleteMedia,
  // Media Folders
  createMediaFolder,
  // Bulk Operations
  bulkUpdateMediaObjects, bulkDeleteMediaObjects
};