/**
 * Members Routes for RACC Membership Portal
 * Public member directory access with admin routes protected
 */

import express from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';
import membersController from '@/controllers/membersController';

const router = express.Router();

/**
 * GET /members
 * List members with optional search (PUBLIC - no authentication required)
 */
router.get('/', async (req, res) => {
  return membersController.getMembers(req, res);
});

/**
 * GET /members/:id
 * Get specific member details (PUBLIC - no authentication required)
 */
router.get('/:id', async (req, res) => {
  return membersController.getMemberById(req, res);
});

/**
 * GET /members/search/:email
 * Find member by email (PUBLIC - no authentication required)
 */
router.get('/search/:email', async (req, res) => {
  return membersController.getMemberByEmail(req, res);
});

/**
 * GET /members/stats
 * Get member statistics (admin only)
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  return membersController.getMemberStats(req, res);
});

export default router;
