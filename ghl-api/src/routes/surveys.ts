const express = require('express');
const { listSurveys, getSurveyById, createSurvey, updateSurvey, deleteSurvey } = require('@/controllers/surveysController');
const router = express.Router();

/**
 * @swagger
 * /surveys:
 *   get:
 *     summary: List all surveys
 *     tags:
 *       - Surveys
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of Survey objects
 */
router.get('/', listSurveys);

/**
 * @swagger
 * /surveys/{id}:
 *   get:
 *     summary: Retrieve a survey by ID
 *     tags:
 *       - Surveys
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Survey object
 */
router.get('/:id', getSurveyById);

/**
 * @swagger
 * /surveys:
 *   post:
 *     summary: Create a new survey
 *     tags:
 *       - Surveys
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Survey created successfully
 */
router.post('/', createSurvey);

/**
 * @swagger
 * /surveys/{id}:
 *   put:
 *     summary: Update a survey by ID
 *     tags:
 *       - Surveys
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Survey updated successfully
 */
router.put('/:id', updateSurvey);

/**
 * @swagger
 * /surveys/{id}:
 *   delete:
 *     summary: Delete a survey by ID
 *     tags:
 *       - Surveys
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Survey deleted successfully
 */
router.delete('/:id', deleteSurvey);

module.exports = router;