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
 * PUT /members/:id
 * Update member information (authenticated - own profile or admin only)
 */
router.put('/:id', requireAuth, async (req, res) => {
  return membersController.updateMember(req, res);
});

/**
 * PUT /members/:id/avatar
 * Update member avatar (authenticated - own profile or admin only)
 */
router.put('/:id/avatar', requireAuth, async (req, res) => {
  return membersController.updateContactAvatar(req, res);
});

/**
 * GET /members/stats
 * Get member statistics (admin only)
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  return membersController.getMemberStats(req, res);
});

/**
 * POST /members/cache/warm
 * Warm the members cache (admin only)
 */
router.post('/cache/warm', requireAuth, requireAdmin, async (req, res) => {
  return membersController.warmCache(req, res);
});

/**
 * GET /members/cache/status
 * Get cache status (admin only)
 */
router.get('/cache/status', requireAuth, requireAdmin, async (req, res) => {
  return membersController.getCacheStatus(req, res);
});

/**
 * DELETE /members/cache
 * Clear all member caches (admin only)
 */
router.delete('/cache', requireAuth, requireAdmin, async (req, res) => {
  return membersController.clearCache(req, res);
});

export default router;
