const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.companies;

async function listCompanies(req, res, next) {
  try {
    // No list method available in the API
    res.status(405).json({ message: 'List companies method not available' });
  } catch (err) {
    next(err);
  }
}

async function getCompanyById(req, res, next) {
  try {
    const result = await svc.getCompany({ companyId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createCompany(req, res, next) {
  try {
    // No create method available in the API
    res.status(405).json({ message: 'Create company method not available' });
  } catch (err) {
    next(err);
  }
}

async function updateCompany(req, res, next) {
  try {
    // No update method available in the API
    res.status(405).json({ message: 'Update company method not available' });
  } catch (err) {
    next(err);
  }
}

async function deleteCompany(req, res, next) {
  try {
    // No delete method available in the API
    res.status(405).json({ message: 'Delete company method not available' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listCompanies, getCompanyById, createCompany, updateCompany, deleteCompany };