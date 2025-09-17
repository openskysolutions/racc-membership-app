// Nominations routes - business nomination submission and management (PUBLIC ACCESS)

import express from 'express';
const { nominationsService } = require('@/services/nominations');
const { permissionService } = require('@/policies/permissions');

interface Nomination {
  id: string;
  nomineeName: string;
  nomineeContact: string;
  submitterId: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface AuthenticatedRequest extends express.Request {
  user?: any;
}

const router = express.Router();

/**
 * GET /nominations
 * List nominations (PUBLIC - no authentication required)
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    
    const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset as string, 10) : undefined;

    const result = await nominationsService.listNominations({
      status: status as string,
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json(result);
  } catch (error) {
    console.error('Nominations list error:', error);
    res.status(500).json({
      error: 'Failed to retrieve nominations'
    });
  }
});

/**
 * POST /nominations
 * Submit a new business nomination (PUBLIC - no authentication required)
 */
router.post('/', async (req: any, res) => {
  try {
    const { nomineeName, nomineeContact, notes } = req.body;
    const submitterId = req.member?.id; // From auth middleware (optional for anonymous)

    // Validate required fields
    if (!nomineeName || !nomineeContact) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'nomineeName and nomineeContact are required'
      });
    }

    // Check for duplicate nomination
    const isDuplicate = await nominationsService.isDuplicateNomination(nomineeContact);
    if (isDuplicate) {
      return res.status(409).json({
        error: 'Duplicate nomination',
        details: 'This business has already been nominated and is pending review'
      });
    }

    // Create nomination
    const nomination = await nominationsService.createNomination({
      nomineeName,
      nomineeContact,
      submitterId,
      notes
    });

    res.status(201).json(nomination);

  } catch (error) {
    console.error('Nomination creation error:', error);
    
    if (error.message.includes('Invalid email')) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: 'Please provide a valid email address for nominee contact'
      });
    }

    res.status(500).json({
      error: 'Failed to create nomination',
      details: 'Please try again'
    });
  }
});

/**
 * GET /nominations
 * List nominations (for moderation dashboard)
 */
router.get('/', async (req: any, res) => {
  try {
    const { status } = req.query;
    const memberId = req.member?.id;

    // Check if user has permission to view nominations
    if (!memberId || !await permissionService.isModerator(memberId)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Moderation access required'
      });
    }

    const nominations = await nominationsService.listNominations(
      status ? { status } : undefined
    );

    res.json({ nominations });

  } catch (error) {
    console.error('Nominations list error:', error);
    res.status(500).json({
      error: 'Failed to retrieve nominations'
    });
  }
});

/**
 * GET /nominations/:id
 * Get specific nomination details
 */
router.get('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const memberId = req.member?.id;

    const nomination = await nominationsService.getNomination(id);
    if (!nomination) {
      return res.status(404).json({
        error: 'Nomination not found'
      });
    }

    // Check permissions - moderators can see all, members can see their own
    const isModerator = memberId && await permissionService.isModerator(memberId);
    const isOwner = nomination.submitterId === memberId;

    if (!isModerator && !isOwner) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    res.json(nomination);

  } catch (error) {
    console.error('Nomination retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve nomination'
    });
  }
});

/**
 * GET /nominations/my
 * Get nominations submitted by the current member
 */
router.get('/my', async (req: any, res) => {
  try {
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const nominations = await nominationsService.getNominationsBySubmitter(memberId);
    res.json({ nominations });

  } catch (error) {
    console.error('My nominations error:', error);
    res.status(500).json({
      error: 'Failed to retrieve your nominations'
    });
  }
});

export default router;
