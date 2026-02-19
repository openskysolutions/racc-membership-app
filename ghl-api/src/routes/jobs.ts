/**
 * Job Postings Routes for RACC Membership Portal
 * Public job listings for chamber members and community
 */

import express, { Request, Response } from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import multer from 'multer';
import path from 'path';
import { emailService } from '@/services/emailService';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../public/uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * GET /jobs
 * List job postings (PUBLIC - no authentication required)
 */
router.get('/', async (req, res) => {
  try {
    const { type, location, company, status = 'active', limit = '20', offset = '0' } = req.query;
    
    const where: any = {
      status: status as string
    };
    
    if (type) {
      where.type = type as string;
    }
    
    if (location) {
      where.location = {
        contains: location as string,
        mode: 'insensitive'
      };
    }
    
    if (company) {
      where.company = company as string;
    }
    
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          postedBy: {
            select: {
              id: true,
              email: true,
              ghlContactId: true
            }
          },
          _count: {
            select: { applications: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.job.count({ where })
    ]);
    
    res.json({
      jobs,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
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
    
    const job = await prisma.job.findUnique({
      where: { id: parseInt(id) },
      include: {
        postedBy: {
          select: {
            id: true,
            email: true,
            ghlContactId: true
          }
        },
        _count: {
          select: { applications: true }
        }
      }
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Increment view count (async, don't wait for it)
    prisma.job.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } }
    }).catch(err => console.error('Error updating view count:', err));
    
    res.json(job);
  } catch (error) {
    console.error('Error fetching job by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /jobs
 * Create new job posting (authentication required - active members only)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if user is active member
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    
    if (!user || user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Only active members can post jobs' 
      });
    }
    
    const { 
      title, 
      company, 
      location, 
      type, 
      salary, 
      description, 
      requirements, 
      expiresAt,
      externalApplicationUrl 
    } = req.body;
    
    if (!title || !company || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'title, company, and description are required'
      });
    }
    
    const job = await prisma.job.create({
      data: {
        title,
        company,
        location: location || 'Richfield, UT',
        type: type || 'full-time',
        salary,
        description,
        requirements: requirements ? JSON.stringify(requirements) : null,
        postedById: parseInt(req.user.id),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        externalApplicationUrl: externalApplicationUrl || null,
        status: 'active'
      },
      include: {
        postedBy: {
          select: {
            id: true,
            email: true,
            ghlContactId: true
          }
        }
      }
    });
    
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /jobs/:id
 * Update job posting (authentication required - must be job owner or admin)
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    const jobId = parseInt(id);
    
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if user is the job owner or admin
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    
    if (existingJob.postedById !== parseInt(req.user.id) && user?.role !== 'admin') {
      return res.status(403).json({ 
        error: 'You can only edit your own job postings' 
      });
    }
    
    const { 
      title, 
      company, 
      location, 
      type, 
      salary, 
      description, 
      requirements, 
      expiresAt,
      externalApplicationUrl,
      status
    } = req.body;
    
    const updateData: any = {};
    
    if (title) updateData.title = title;
    if (company) updateData.company = company;
    if (location) updateData.location = location;
    if (type) updateData.type = type;
    if (salary !== undefined) updateData.salary = salary;
    if (description) updateData.description = description;
    if (requirements !== undefined) {
      updateData.requirements = requirements ? JSON.stringify(requirements) : null;
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }
    if (externalApplicationUrl !== undefined) {
      updateData.externalApplicationUrl = externalApplicationUrl || null;
    }
    if (status) updateData.status = status;
    
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        postedBy: {
          select: {
            id: true,
            email: true,
            ghlContactId: true
          }
        }
      }
    });
    
    res.json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /jobs/:id
 * Delete job posting (authentication required - must be job owner or admin)
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    const jobId = parseInt(id);
    
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if user is the job owner or admin
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    
    if (existingJob.postedById !== parseInt(req.user.id) && user?.role !== 'admin') {
      return res.status(403).json({ 
        error: 'You can only delete your own job postings' 
      });
    }
    
    await prisma.job.delete({
      where: { id: jobId }
    });
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /jobs/:id/apply
 * Submit job application (PUBLIC - no authentication required)
 */
router.post('/:id/apply', upload.single('resume'), async (req, res) => {
  try {
    const { id } = req.params;
    const jobId = parseInt(id);
    
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!job || job.status !== 'active') {
      return res.status(404).json({ error: 'Job not found or no longer active' });
    }
    
    const { 
      applicantName, 
      applicantEmail, 
      applicantPhone, 
      coverLetter,
      resumeGoogleDocLink 
    } = req.body;
    
    if (!applicantName || !applicantEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'applicantName and applicantEmail are required'
      });
    }
    
    // At least one of: uploaded file or Google Doc link required
    if (!req.file && !resumeGoogleDocLink) {
      return res.status(400).json({
        error: 'Resume required',
        details: 'Please upload a resume file or provide a Google Doc link'
      });
    }
    
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        applicantName,
        applicantEmail,
        applicantPhone: applicantPhone || null,
        coverLetter: coverLetter || null,
        resumeFileUrl: req.file ? `/uploads/resumes/${req.file.filename}` : null,
        resumeFileName: req.file ? req.file.originalname : null,
        resumeGoogleDocLink: resumeGoogleDocLink || null,
        status: 'pending'
      }
    });
    
    // Send email notification to job poster
    try {
      const jobWithPoster = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          postedBy: {
            select: { email: true }
          }
        }
      });
      
      if (jobWithPoster?.postedBy) {
        const resumeInfo = req.file 
          ? `Uploaded file: ${req.file.originalname}` 
          : `Google Doc: ${resumeGoogleDocLink}`;
        
        const emailHtml = `
          <h2>New Job Application Received</h2>
          <p>You have received a new application for your job posting:</p>
          <h3>${job.title}</h3>
          <hr>
          <p><strong>Applicant Name:</strong> ${applicantName}</p>
          <p><strong>Email:</strong> ${applicantEmail}</p>
          ${applicantPhone ? `<p><strong>Phone:</strong> ${applicantPhone}</p>` : ''}
          <p><strong>Resume:</strong> ${resumeInfo}</p>
          ${coverLetter ? `<p><strong>Cover Letter:</strong></p><p>${coverLetter}</p>` : ''}
          <hr>
          <p>Log in to your RACC member portal to view all applications and manage your job posting.</p>
        `;
        
        const emailText = `
New Job Application Received

You have received a new application for your job posting: ${job.title}

Applicant Name: ${applicantName}
Email: ${applicantEmail}
${applicantPhone ? `Phone: ${applicantPhone}\n` : ''}Resume: ${resumeInfo}
${coverLetter ? `\nCover Letter:\n${coverLetter}\n` : ''}
Log in to your RACC member portal to view all applications and manage your job posting.
        `;
        
        await emailService.sendEmail({
          to: jobWithPoster.postedBy.email,
          subject: `New Application: ${job.title}`,
          html: emailHtml,
          text: emailText
        });
      }
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error('Failed to send application notification email:', emailError);
    }
    
    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /jobs/:id/applications
 * Get applications for a job (authentication required - must be job owner or admin)
 */
router.get('/:id/applications', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { id } = req.params;
    const jobId = parseInt(id);
    
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if user is the job owner or admin
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id) }
    });
    
    if (job.postedById !== parseInt(req.user.id) && user?.role !== 'admin') {
      return res.status(403).json({ 
        error: 'You can only view applications for your own job postings' 
      });
    }
    
    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
