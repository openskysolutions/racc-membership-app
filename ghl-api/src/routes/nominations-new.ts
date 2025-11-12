/**
 * Nominations API Routes
 * Public nominations submission and board member voting
 */

import express from 'express';
import { nominationsController } from '@/controllers/nominationsController';
import { requireAuth } from '@/middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /nominations:
 *   post:
 *     summary: Submit a new nomination
 *     tags:
 *       - Nominations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - category
 *               - nomineeGhlId
 *               - nomineeName
 *               - nominatorName
 *               - nominatorEmail
 *               - reason
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [business, individual]
 *               category:
 *                 type: string
 *                 enum: [business_of_month, customer_service_superstar]
 *               nomineeGhlId:
 *                 type: string
 *               nomineeName:
 *                 type: string
 *               nomineeBusinessName:
 *                 type: string
 *               nomineeEmail:
 *                 type: string
 *               nomineePhone:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Nomination created successfully
 */
router.post('/', (req, res) => nominationsController.createNomination(req, res));

/**
 * @swagger
 * /nominations:
 *   get:
 *     summary: List all nominations
 *     tags:
 *       - Nominations
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [business, individual]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [business_of_month, customer_service_superstar]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of nominations with vote statistics
 */
router.get('/', (req, res) => nominationsController.listNominations(req, res));

/**
 * @swagger
 * /nominations/search:
 *   get:
 *     summary: Search for businesses or contacts to nominate
 *     tags:
 *       - Nominations
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [business, individual]
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', (req, res) => nominationsController.searchNominees(req, res));

/**
 * @swagger
 * /nominations/{id}:
 *   get:
 *     summary: Get a single nomination by ID
 *     tags:
 *       - Nominations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Nomination details with vote statistics
 */
router.get('/:id', (req, res) => nominationsController.getNomination(req, res));

/**
 * @swagger
 * /nominations/{id}/vote:
 *   post:
 *     summary: Cast a vote on a nomination (board members only)
 *     tags:
 *       - Nominations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voteValue
 *             properties:
 *               voteValue:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 */
router.post('/:id/vote', requireAuth, (req, res) => nominationsController.voteOnNomination(req, res));

/**
 * @swagger
 * /nominations/{id}/votes:
 *   get:
 *     summary: Get all votes for a nomination
 *     tags:
 *       - Nominations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vote summary and distribution
 */
router.get('/:id/votes', (req, res) => nominationsController.getVotes(req, res));

/**
 * @swagger
 * /nominations/{id}/status:
 *   patch:
 *     summary: Update nomination status (admin only)
 *     tags:
 *       - Nominations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status', requireAuth, (req, res) => nominationsController.updateStatus(req, res));

export default router;
