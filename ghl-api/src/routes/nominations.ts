// Nominations routes - business nomination submission and management

import express from 'express';
import { NominationsController } from '@/controllers/nominationsController';
import { requireAuth } from '@/middleware/auth';

const router = express.Router();
const controller = new NominationsController();

/**
 * GET /nominations
 * List nominations with filters (PUBLIC)
 * Query params: type, category, status, year, month, limit, offset
 */
router.get('/', (req, res) => controller.listNominations(req, res));

/**
 * POST /nominations
 * Submit a new nomination (PUBLIC - no authentication required)
 * Body: { type, category, name?, businessName, reason }
 */
router.post('/', (req, res) => controller.createNomination(req, res));

/**
 * GET /nominations/:id
 * Get specific nomination details (PUBLIC)
 */
router.get('/:id', (req, res) => controller.getNomination(req, res));

/**
 * PATCH /nominations/:id/status
 * Update nomination status (REQUIRES AUTH - admin only)
 * Body: { status: 'pending' | 'approved' | 'rejected' }
 */
router.patch('/:id/status', requireAuth, (req, res) => controller.updateStatus(req, res));

/**
 * POST /nominations/:id/vote
 * Vote on a nomination (REQUIRES AUTH)
 * Body: { voteValue: 1-5, comment?: string }
 */
router.post('/:id/vote', requireAuth, (req, res) => controller.voteOnNomination(req, res));

/**
 * GET /nominations/:id/votes
 * Get votes for a nomination (PUBLIC)
 */
router.get('/:id/votes', (req, res) => controller.getVotes(req, res));

export default router;
