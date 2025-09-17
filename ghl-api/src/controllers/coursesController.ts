const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.courses;

export async function listCourses(req, res, next) {
  try {
    // No standard list method available - only importCourses
    res.status(405).json({ message: 'List courses method not available. Use importCourses instead.' });
  } catch (err) { next(err); }
}

export async function getCourseById(req, res, next) {
  try {
    // No get method available in the API
    res.status(405).json({ message: 'Get course method not available' });
  } catch (err) { next(err); }
}

export async function createCourse(req, res, next) {
  try {
    // No create method available - only importCourses
    res.status(405).json({ message: 'Create course method not available. Use importCourses instead.' });
  } catch (err) { next(err); }
}

export async function updateCourse(req, res, next) {
  try {
    // No update method available in the API
    res.status(405).json({ message: 'Update course method not available' });
  } catch (err) { next(err); }
}

export async function deleteCourse(req, res, next) {
  try {
    // No delete method available in the API
    res.status(405).json({ message: 'Delete course method not available' });
  } catch (err) { next(err); }
}

module.exports = { listCourses, getCourseById, createCourse, updateCourse, deleteCourse };