const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.links;

async function listLinks(req, res, next) {
  try {
    const result = await svc.getLinks({ limit: req.query.limit, skip: req.query.skip }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getLinkById(req, res, next) {
  try {
    const result = await svc.getLinkById({ linkId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createLink(req, res, next) {
  try {
    const result = await svc.createLink({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateLink(req, res, next) {
  try {
    const result = await svc.updateLink({ linkId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteLink(req, res, next) {
  try {
    await svc.deleteLink({ linkId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { listLinks, getLinkById, createLink, updateLink, deleteLink };