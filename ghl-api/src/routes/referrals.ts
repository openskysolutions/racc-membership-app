/**
 * Referrals Routes for RACC Membership Portal
 * Member-to-member referrals. Feed is public; everything else requires auth.
 * Admin moderation routes are exported separately and mounted under /admin/referrals.
 */

import express from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';
import referralsController from '@/controllers/referralsController';

const router = express.Router();

// Public (must be registered before /:id routes)
router.get('/feed', (req, res) => referralsController.getPublicFeed(req, res));

router.get('/leaderboard', (req, res) => referralsController.getLeaderboard(req, res));
router.get('/recipients/:businessId', requireAuth, (req, res) => referralsController.getRecipients(req, res));
router.get('/mine', requireAuth, (req, res) => referralsController.getMyReferrals(req, res));
router.post('/non-member', requireAuth, (req, res) => referralsController.createNonMember(req, res));
router.post('/', requireAuth, (req, res) => referralsController.createReferral(req, res));
router.patch('/:id/status', requireAuth, (req, res) => referralsController.updateReferralStatus(req, res));
router.post('/:id/testimonial', requireAuth, (req, res) => referralsController.addTestimonial(req, res));

export const adminReferralsRoutes = express.Router();
adminReferralsRoutes.get('/', requireAuth, requireAdmin, (req, res) => referralsController.getAdminReferrals(req, res));
adminReferralsRoutes.patch('/non-member/:id', requireAuth, requireAdmin, (req, res) => referralsController.adminUpdateNonMember(req, res));
adminReferralsRoutes.patch('/:id', requireAuth, requireAdmin, (req, res) => referralsController.adminModerateReferral(req, res));

export default router;
