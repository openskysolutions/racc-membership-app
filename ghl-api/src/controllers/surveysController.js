const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.surveys;

async function listSurveys(req, res, next) {
  try {
    const result = await svc.getSurveys({ limit: req.query.limit, skip: req.query.skip }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getSurveyById(req, res, next) {
  try {
    // No individual survey get method available - use getSurveysSubmissions for survey submissions
    const result = await svc.getSurveysSubmissions({ surveyId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createSurvey(req, res, next) {
  try {
    // No create survey method available in the API
    res.status(405).json({ message: 'Create survey method not available' });
  } catch (err) { next(err); }
}

async function updateSurvey(req, res, next) {
  try {
    // No update survey method available in the API
    res.status(405).json({ message: 'Update survey method not available' });
  } catch (err) { next(err); }
}

async function deleteSurvey(req, res, next) {
  try {
    // No delete survey method available in the API
    res.status(405).json({ message: 'Delete survey method not available' });
  } catch (err) { next(err); }
}

module.exports = { listSurveys, getSurveyById, createSurvey, updateSurvey, deleteSurvey };