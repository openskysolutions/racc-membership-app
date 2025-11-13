// Nominations routes - business nomination submission and management

import express from 'express';
import { NominationsController } from '@/controllers/nominationsController';
import { requireAuth } from '@/middleware/auth';

const router = express.Router();
const controller = new NominationsController();

/**
 * GET /nominations/voting
 * Get nominations available for voting in current period (REQUIRES AUTH - board members only)
 * MUST be before /:id routes to avoid conflicts
 */
router.get('/voting', requireAuth, (req, res) => controller.getVotingNominations(req, res));

/**
 * GET /nominations/voting/status
 * Get current user's voting status (REQUIRES AUTH - board members only)
 */
router.get('/voting/status', requireAuth, (req, res) => controller.getVotingStatus(req, res));

/**
 * GET /nominations/yearly/voting
 * Get monthly winners available for yearly voting (Oct 1-20 only) (REQUIRES AUTH - board members only)
 */
router.get('/yearly/voting', requireAuth, (req, res) => controller.getYearlyVotingNominations(req, res));

/**
 * GET /nominations/yearly/status
 * Get current user's yearly voting status (REQUIRES AUTH - board members only)
 */
router.get('/yearly/status', requireAuth, (req, res) => controller.getYearlyVotingStatus(req, res));

/**
 * GET /nominations/yearly/winners
 * Get previous yearly winners (PUBLIC)
 * Query params: year (optional, defaults to previous year)
 */
router.get('/yearly/winners', (req, res) => controller.getYearlyWinners(req, res));

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
 * POST /nominations/:id/vote/yearly
 * Vote on a yearly winner (Oct 1-20 only) (REQUIRES AUTH - board members only)
 */
router.post('/:id/vote/yearly', requireAuth, (req, res) => controller.voteOnYearlyNomination(req, res));

/**
 * GET /nominations/:id/votes
 * Get votes for a nomination (PUBLIC)
 */
router.get('/:id/votes', (req, res) => controller.getVotes(req, res));

export default router;
