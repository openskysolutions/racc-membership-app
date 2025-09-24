/**
 * Job Postings Routes for RACC Membership Portal
 * Public job listings for chamber members and community
 */

import express, { Request, Response } from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';

// Type extensions are automatically available through tsconfig.json

const router = express.Router();

// Mock job data - in production this would connect to a database
const mockJobs = [
  {
    id: 'job_001',
    title: 'Marketing Manager',
    company: 'Johnson Real Estate Group',
    location: 'Richfield, UT',
    type: 'Full-time',
    salary: '$45,000 - $60,000',
    description: 'Seeking an experienced marketing manager to lead our digital marketing efforts.',
    requirements: ['Bachelor\'s degree in Marketing', '3+ years experience', 'Digital marketing skills'],
    postedBy: 'member_001',
    postedDate: '2024-09-01',
    expiresDate: '2024-10-01',
    status: 'active'
  },
  {
    id: 'job_002',
    title: 'Construction Foreman',
    company: 'Davis Construction LLC',
    location: 'Richfield, UT',
    type: 'Full-time',
    salary: '$50,000 - $70,000',
    description: 'Lead construction crews on residential and commercial projects.',
    requirements: ['5+ years construction experience', 'Leadership skills', 'Valid driver\'s license'],
    postedBy: 'member_002',
    postedDate: '2024-09-05',
    expiresDate: '2024-10-05',
    status: 'active'
  },
  {
    id: 'job_003',
    title: 'Part-time Sales Associate',
    company: 'Brown\'s Hardware Store',
    location: 'Richfield, UT',
    type: 'Part-time',
    salary: '$15 - $18/hour',
    description: 'Help customers with hardware needs and maintain store inventory.',
    requirements: ['Customer service experience', 'Basic tool knowledge helpful', 'Flexible schedule'],
    postedBy: 'member_006',
    postedDate: '2024-09-10',
    expiresDate: '2024-10-10',
    status: 'active'
  }
];

/**
 * GET /jobs
 * List job postings (PUBLIC - no authentication required)
 */
router.get('/', async (req, res) => {
  try {
    const { type, location, limit, offset } = req.query;
    
    let filteredJobs = mockJobs.filter(job => job.status === 'active');
    
    // Filter by job type
    if (type) {
      filteredJobs = filteredJobs.filter(job => 
        job.type.toLowerCase() === (type as string).toLowerCase()
      );
    }
    
    // Filter by location
    if (location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes((location as string).toLowerCase())
      );
    }
    
    // Apply pagination
    const parsedLimit = limit ? parseInt(limit as string, 10) : 20;
    const parsedOffset = offset ? parseInt(offset as string, 10) : 0;
    const paginatedJobs = filteredJobs.slice(parsedOffset, parsedOffset + parsedLimit);
    
    res.json({
      jobs: paginatedJobs,
      total: filteredJobs.length,
      limit: parsedLimit,
      offset: parsedOffset
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /jobs/:id
 * Get specific job details (PUBLIC - no authentication required)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = mockJobs.find(j => j.id === id && j.status === 'active');
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Error fetching job by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /jobs
 * Create new job posting (authentication required)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, company, location, type, salary, description, requirements, expiresDate } = req.body;
    
    if (!title || !company || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'title, company, and description are required'
      });
    }
    
    const newJob = {
      id: `job_${Date.now()}`,
      title,
      company,
      location: location || 'Richfield, UT',
      type: type || 'Full-time',
      salary,
      description,
      requirements: requirements || [],
      postedBy: req.user?.id,
      postedDate: new Date().toISOString().split('T')[0],
      expiresDate: expiresDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    };
    
    mockJobs.push(newJob);
    
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
