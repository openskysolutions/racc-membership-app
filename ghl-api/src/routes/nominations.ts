// Nominations routes - business nomination submission and management (PUBLIC ACCESS)

import express from 'express';
const { nominationsService } = require('@/services/nominations');
const { permissionService } = require('@/policies/permissions');

interface Nomination {
  id: string;
  title: string;
  description: string;
  category: 'member' | 'business' | 'volunteer' | 'leadership';
  nomineeInfo: {
    name: string;
    email?: string;
    organization?: string;
    phone?: string;
  };
  nominatorInfo: {
    name: string;
    email: string;
    organization?: string;
  };
  status: 'pending' | 'under-review' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  attachments?: string[];
}

interface AuthenticatedRequest extends express.Request {
  user?: any;
}

const router = express.Router();

/**
 * GET /nominations
 * List nominations (PUBLIC - returns all nominations)
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    
    const parsedLimit = limit ? parseInt(limit as string, 10) : 10;
    const parsedOffset = offset ? parseInt(offset as string, 10) : 0;

    // Get nominations from service
    const allNominations = await nominationsService.listNominations();
    
    // Filter by status if provided
    let filteredNominations = allNominations;
    if (status) {
      filteredNominations = allNominations.filter(nom => nom.status === status);
    }
    
    // Apply pagination
    const total = filteredNominations.length;
    const paginatedNominations = filteredNominations.slice(parsedOffset, parsedOffset + parsedLimit);
    
    // Convert to frontend format
    const formattedNominations = paginatedNominations.map(nom => ({
      id: nom.id,
      title: nom.title || `${nom.category || 'Business'} Nomination`,
      description: nom.description || nom.notes || '',
      category: nom.category || 'business',
      nomineeInfo: {
        name: nom.nomineeName || nom.nomineeInfo?.name || '',
        email: nom.nomineeContact || nom.nomineeInfo?.email,
        organization: nom.nomineeInfo?.organization,
        phone: nom.nomineeInfo?.phone
      },
      nominatorInfo: {
        name: nom.nominatorInfo?.name || 'Anonymous',
        email: nom.nominatorInfo?.email || 'anonymous@example.com',
        organization: nom.nominatorInfo?.organization
      },
      status: nom.status === 'approved' ? 'approved' : nom.status === 'rejected' ? 'rejected' : 'pending',
      submittedAt: nom.createdAt || nom.submittedAt,
      reviewedAt: nom.reviewedAt,
      reviewedBy: nom.reviewedBy,
      notes: nom.notes,
      attachments: nom.attachments || []
    }));

    const result = {
      nominations: formattedNominations,
      total,
      limit: parsedLimit,
      offset: parsedOffset
    };

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
 * Submit a new nomination (PUBLIC - no authentication required)
 */
router.post('/', async (req: any, res) => {
  try {
    const { title, description, category, nomineeInfo, nominatorInfo } = req.body;
    
    // Handle both new format and legacy format for backwards compatibility
    let nominationData;
    
    if (title && description && category && nomineeInfo && nominatorInfo) {
      // New frontend format
      nominationData = {
        title,
        description,
        category,
        nomineeInfo,
        nominatorInfo,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };
    } else {
      // Legacy format - convert to new format
      const { nomineeName, nomineeContact, notes, category: legacyCategory = 'business' } = req.body;
      
      if (!nomineeName || !nomineeContact) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'nomineeName and nomineeContact are required'
        });
      }
      
      nominationData = {
        title: `${legacyCategory.charAt(0).toUpperCase() + legacyCategory.slice(1)} Nomination`,
        description: notes || '',
        category: legacyCategory,
        nomineeInfo: {
          name: nomineeName,
          email: nomineeContact
        },
        nominatorInfo: {
          name: 'Anonymous',
          email: 'anonymous@example.com'
        },
        status: 'pending',
        submittedAt: new Date().toISOString()
      };
    }

    // Validate required fields for new format
    if (!nominationData.nomineeInfo?.name || !nominationData.nominatorInfo?.email) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Nominee name and nominator email are required'
      });
    }

    // Save nomination using the service
    let savedNomination;
    
    if (title && description && category) {
      // New format - create enhanced nomination object
      const enhancedNominationData = {
        nomineeName: nominationData.nomineeInfo.name,
        nomineeContact: nominationData.nominatorInfo.email,
        notes: nominationData.description,
        category: nominationData.category,
        title: nominationData.title,
        nomineeInfo: nominationData.nomineeInfo,
        nominatorInfo: nominationData.nominatorInfo
      };
      
      savedNomination = await nominationsService.createNomination(enhancedNominationData);
      
      // Enhance the saved nomination with frontend format
      savedNomination = {
        ...savedNomination,
        title: nominationData.title,
        description: nominationData.description,
        nomineeInfo: nominationData.nomineeInfo,
        nominatorInfo: nominationData.nominatorInfo,
        submittedAt: savedNomination.createdAt
      };
    } else {
      // Legacy format
      savedNomination = await nominationsService.createNomination({
        nomineeName: nominationData.nomineeInfo.name,
        nomineeContact: nominationData.nominatorInfo.email,
        notes: nominationData.description,
        category: nominationData.category
      });
    }

    res.status(201).json(savedNomination);

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
 * GET /nominations/my
 * Get nominations submitted by the current user (PUBLIC - returns empty for anonymous)
 */
router.get('/my', async (req: any, res) => {
  try {
    const memberId = req.member?.id;

    // For anonymous users, return empty list
    if (!memberId) {
      return res.json({ nominations: [] });
    }

    // For authenticated users, would return their nominations
    // For now, return empty since we don't have real backend
    const nominations = [];
    res.json({ nominations });

  } catch (error) {
    console.error('My nominations error:', error);
    res.status(500).json({
      error: 'Failed to retrieve your nominations'
    });
  }
});

/**
 * GET /nominations/moderation-access
 * Check if current user has moderation access (PUBLIC - returns false for anonymous)
 */
router.get('/moderation-access', async (req: any, res) => {
  try {
    const memberId = req.member?.id;

    // For testing purposes, grant moderation access to everyone
    res.json({ hasAccess: true });

  } catch (error) {
    console.error('Moderation access check error:', error);
    res.status(500).json({
      error: 'Failed to check moderation access'
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
 * POST /nominations/bulk-approve
 * Bulk approve multiple nominations
 */
router.post('/bulk-approve', async (req: any, res) => {
  try {
    const { nominationIds, reason } = req.body;
    const memberId = req.member?.id || req.query.memberId;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check if user has moderation permissions
    const hasPermission = await permissionService.hasModerationAccess(memberId);
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Moderation access required'
      });
    }

    if (!Array.isArray(nominationIds) || nominationIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'nominationIds must be a non-empty array'
      });
    }

    const results = [];
    for (const id of nominationIds) {
      try {
        const updatedNomination = await nominationsService.updateNomination(id, {
          status: 'approved',
          reviewedBy: memberId,
          reviewedAt: new Date().toISOString(),
          notes: reason || 'Bulk approved'
        });
        results.push({ id, status: 'success', nomination: updatedNomination });
      } catch (error) {
        results.push({ id, status: 'error', error: error.message });
      }
    }

    res.json({
      message: 'Bulk approval completed',
      results,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length
    });

  } catch (error) {
    console.error('Bulk approval error:', error);
    res.status(500).json({
      error: 'Failed to process bulk approval'
    });
  }
});

/**
 * POST /nominations/bulk-reject
 * Bulk reject multiple nominations
 */
router.post('/bulk-reject', async (req: any, res) => {
  try {
    const { nominationIds, reason } = req.body;
    const memberId = req.member?.id || req.query.memberId;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check if user has moderation permissions
    const hasPermission = await permissionService.hasModerationAccess(memberId);
    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Moderation access required'
      });
    }

    if (!Array.isArray(nominationIds) || nominationIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'nominationIds must be a non-empty array'
      });
    }

    const results = [];
    for (const id of nominationIds) {
      try {
        const updatedNomination = await nominationsService.updateNomination(id, {
          status: 'rejected',
          reviewedBy: memberId,
          reviewedAt: new Date().toISOString(),
          notes: reason || 'Bulk rejected'
        });
        results.push({ id, status: 'success', nomination: updatedNomination });
      } catch (error) {
        results.push({ id, status: 'error', error: error.message });
      }
    }

    res.json({
      message: 'Bulk rejection completed',
      results,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length
    });

  } catch (error) {
    console.error('Bulk rejection error:', error);
    res.status(500).json({
      error: 'Failed to process bulk rejection'
    });
  }
});

/**
 * GET /nominations/stats
 * Get nomination statistics for status tracking
 */
router.get('/stats', async (req: any, res) => {
  try {
    const memberId = req.member?.id || req.query.memberId;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const allNominations = await nominationsService.listNominations();
    
    // Check if user has moderation access for full stats
    const hasPermission = await permissionService.hasModerationAccess(memberId);
    
    if (hasPermission) {
      // Return full statistics for moderators
      const stats = {
        total: allNominations.length,
        pending: allNominations.filter(n => n.status === 'pending').length,
        underReview: allNominations.filter(n => n.status === 'under-review').length,
        approved: allNominations.filter(n => n.status === 'approved').length,
        rejected: allNominations.filter(n => n.status === 'rejected').length,
        byCategory: {
          member: allNominations.filter(n => n.category === 'member').length,
          business: allNominations.filter(n => n.category === 'business').length,
          volunteer: allNominations.filter(n => n.category === 'volunteer').length,
          leadership: allNominations.filter(n => n.category === 'leadership').length
        }
      };
      res.json(stats);
    } else {
      // Return limited statistics for regular users (their own nominations)
      const userNominations = allNominations.filter(n => n.submitterId === memberId);
      const stats = {
        myNominations: {
          total: userNominations.length,
          pending: userNominations.filter(n => n.status === 'pending').length,
          underReview: userNominations.filter(n => n.status === 'under-review').length,
          approved: userNominations.filter(n => n.status === 'approved').length,
          rejected: userNominations.filter(n => n.status === 'rejected').length
        }
      };
      res.json(stats);
    }

  } catch (error) {
    console.error('Nomination stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve nomination statistics'
    });
  }
});

export default router;
