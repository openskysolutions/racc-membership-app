import express from 'express';

// New RACC membership portal routes  
import authRoutes from '@/routes/auth';
import nominationsRoutes from '@/routes/nominations';
import membersRoutes from '@/routes/members';
import eventsRoutes from '@/routes/events';
import jobsRoutes from '@/routes/jobs';
import newsRoutes from '@/routes/news';

const router = express.Router();

// RACC membership portal API routes (public routes for basic listings)
router.use('/auth', authRoutes);
router.use('/nominations', nominationsRoutes);
router.use('/members', membersRoutes);
router.use('/events', eventsRoutes);
router.use('/jobs', jobsRoutes);
router.use('/news', newsRoutes);

export default router;