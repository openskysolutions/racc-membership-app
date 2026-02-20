import express from 'express';

// New RACC membership portal routes  
import authRoutes from '@/routes/auth';
import webhookRoutes from '@/routes/webhooks';
import nominationsRoutes from '@/routes/nominations';
import membersRoutes from '@/routes/members';
import eventsRoutes from '@/routes/events';
import jobsRoutes from '@/routes/jobs';
import newsRoutes from '@/routes/news';
import calendarsRoutes from '@/routes/calendars';
import adminRoutes from '@/routes/admin';
import postCategoriesRoutes from '@/routes/post-categories';
import postAuthorsRoutes from '@/routes/post-authors';
import postsRoutes from '@/routes/posts';
import formsRoutes from '@/routes/forms';

// CommonJS imports
const moderationRoutes = require('@/routes/moderation');
const mediasRoutes = require('@/routes/medias');
const locationsRoutes = require('@/routes/locations');
const testRoutes = require('@/routes/test');

const router = express.Router();

// RACC membership portal API routes (public routes for basic listings)
router.use('/auth', authRoutes); // Enhanced auth routes with registration
router.use('/webhooks', webhookRoutes); // Payment and subscription webhooks
router.use('/nominations', nominationsRoutes);
router.use('/members', membersRoutes);
router.use('/events', eventsRoutes);
router.use('/moderation', moderationRoutes);
router.use('/jobs', jobsRoutes);
router.use('/news', newsRoutes);
router.use('/calendars', calendarsRoutes);
router.use('/medias', mediasRoutes);
router.use('/locations', locationsRoutes);
router.use('/admin', adminRoutes); // Admin-only user management routes
router.use('/test', testRoutes);

// Blog routes
router.use('/post-categories', postCategoriesRoutes);
router.use('/post-authors', postAuthorsRoutes);
router.use('/posts', postsRoutes);

// Forms routes
router.use('/forms', formsRoutes);

export default router;