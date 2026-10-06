// Election routes - executive board member elections (positions, candidates, voting, results)

import express from 'express';
import { electionsController } from '@/controllers/electionsController';
import { requireAuth, requireBoardMember, requireExecutiveDirector, optionalAuth } from '@/middleware/auth';

const router = express.Router();

/**
 * GET /elections
 * List election positions. Active members see voting_open/results_published only.
 * Board/admin pass ?all=true to see every position (draft/voting_closed included).
 */
router.get('/', optionalAuth, (req, res) => electionsController.listPositions(req, res));

/**
 * POST /elections
 * Create a new election position (REQUIRES BOARD MEMBER)
 * Body: { title, description?, seatsAvailable?, votingStartAt?, votingEndAt? }
 */
router.post('/', requireAuth, requireBoardMember, (req, res) => electionsController.createPosition(req, res));

/**
 * GET /elections/:id
 * Get a single position with its candidates
 */
router.get('/:id', optionalAuth, (req, res) => electionsController.getPosition(req, res));

/**
 * PATCH /elections/:id
 * Update a position (REQUIRES BOARD MEMBER) - only before voting opens
 */
router.patch('/:id', requireAuth, requireBoardMember, (req, res) => electionsController.updatePosition(req, res));

/**
 * DELETE /elections/:id
 * Delete a position (REQUIRES BOARD MEMBER)
 */
router.delete('/:id', requireAuth, requireBoardMember, (req, res) => electionsController.deletePosition(req, res));

/**
 * POST /elections/:id/candidates
 * Add a candidate to a position (REQUIRES BOARD MEMBER)
 * Body: { name, businessName?, statement? }
 */
router.post('/:id/candidates', requireAuth, requireBoardMember, (req, res) => electionsController.addCandidate(req, res));

/**
 * PATCH /elections/:id/candidates/:candidateId
 * Update a candidate's name/business/statement (REQUIRES BOARD MEMBER) - only before voting opens
 */
router.patch('/:id/candidates/:candidateId', requireAuth, requireBoardMember, (req, res) => electionsController.updateCandidate(req, res));

/**
 * DELETE /elections/:id/candidates/:candidateId
 * Remove a candidate from a position (REQUIRES BOARD MEMBER)
 */
router.delete('/:id/candidates/:candidateId', requireAuth, requireBoardMember, (req, res) => electionsController.removeCandidate(req, res));

/**
 * POST /elections/:id/vote
 * Cast a ballot for a position (REQUIRES AUTH, active members only)
 * Body: { candidateIds: number[] }
 */
router.post('/:id/vote', requireAuth, (req, res) => electionsController.castVote(req, res));

/**
 * PATCH /elections/:id/open
 * Manually open voting on a draft position right now (REQUIRES BOARD MEMBER)
 */
router.patch('/:id/open', requireAuth, requireBoardMember, (req, res) => electionsController.openVoting(req, res));

/**
 * PATCH /elections/:id/close
 * Manually close voting on a position (REQUIRES BOARD MEMBER)
 */
router.patch('/:id/close', requireAuth, requireBoardMember, (req, res) => electionsController.closeVoting(req, res));

/**
 * PATCH /elections/:id/reopen
 * Reopen voting on a position closed in error, before results are published (REQUIRES BOARD MEMBER)
 */
router.patch('/:id/reopen', requireAuth, requireBoardMember, (req, res) => electionsController.reopenVoting(req, res));

/**
 * PATCH /elections/:id/revert-to-draft
 * Send an open position back to draft, e.g. it opened before candidates were
 * finalized (REQUIRES BOARD MEMBER) - clears the voting start date
 */
router.patch('/:id/revert-to-draft', requireAuth, requireBoardMember, (req, res) => electionsController.revertToDraft(req, res));

/**
 * PATCH /elections/:id/publish
 * Publish results for a position (REQUIRES BOARD MEMBER) - only once voting is closed
 */
router.patch('/:id/publish', requireAuth, requireBoardMember, (req, res) => electionsController.publishResults(req, res));

/**
 * PATCH /elections/:id/tie-break
 * Record the Executive Director's tie-break picks for the last seat(s) (REQUIRES EXECUTIVE DIRECTOR)
 * Body: { candidateIds: number[] }
 */
router.patch('/:id/tie-break', requireAuth, requireExecutiveDirector, (req, res) => electionsController.resolveTie(req, res));

/**
 * GET /elections/:id/results
 * Get results for a position. Members see winners only once published.
 * Board/admin pass ?all=true to see the full per-candidate tally at any time.
 */
router.get('/:id/results', optionalAuth, (req, res) => electionsController.getResults(req, res));

export default router;
