const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.users;

async function listUsers(req, res, next) {
  try {
    const result = await svc.searchUsers({ limit: req.query.limit, skip: req.query.skip }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getUserById(req, res, next) {
  try {
    const result = await svc.getUser({ userId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const result = await svc.createUser({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const result = await svc.updateUser({ userId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    await svc.deleteUser({ userId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser };