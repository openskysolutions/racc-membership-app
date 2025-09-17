// Moderation routes - content moderation and reporting

const express = require('express');
const { moderationService } = require('@/services/moderation.js');
const { nominationsService } = require('@/services/nominations.js');
const { permissionService } = require('@/policies/permissions.js');

const router = express.Router();

/**
 * POST /moderation/posts/:id/report
 * Report content for moderation review
 */
router.post('/posts/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        error: 'Report reason is required'
      });
    }

    const reportId = await moderationService.reportContent(
      'post',
      id,
      memberId,
      reason
    );

    res.status(201).json({
      reportId,
      message: 'Content reported successfully'
    });

  } catch (error) {
    console.error('Content report error:', error);
    res.status(500).json({
      error: 'Failed to report content'
    });
  }
});

/**
 * PATCH /moderation/posts/:id
 * Moderate content (hide, remove, restore)
 */
router.patch('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check moderation permissions
    if (!await permissionService.isModerator(memberId)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Moderation access required'
      });
    }

    const validActions = ['hide', 'remove', 'restore'];
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        error: 'Invalid action',
        details: `Action must be one of: ${validActions.join(', ')}`
      });
    }

    // Perform moderation action
    switch (action) {
      case 'hide':
        await moderationService.hideContent('post', id, memberId, reason);
        break;
      case 'remove':
        await moderationService.removeContent('post', id, memberId, reason);
        break;
      case 'restore':
        await moderationService.restoreContent('post', id, memberId, reason);
        break;
    }

    res.json({
      status: action,
      message: `Content ${action}d successfully`
    });

  } catch (error) {
    console.error('Content moderation error:', error);
    res.status(500).json({
      error: 'Failed to moderate content'
    });
  }
});

/**
 * POST /moderation/nominations/:id/approve
 * Approve a nomination
 */
router.post('/nominations/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check moderation permissions
    if (!await permissionService.isModerator(memberId)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Moderation access required'
      });
    }

    // Check if nomination exists
    const nomination = await nominationsService.getNomination(id);
    if (!nomination) {
      return res.status(404).json({
        error: 'Nomination not found'
      });
    }

    // Update nomination status
    const updatedNomination = await nominationsService.updateNominationStatus(
      id,
      'approved',
      notes
    );

    // Log moderation action
    await moderationService.approveContent('nomination', id, memberId, notes);

    res.json({
      status: 'approved',
      nomination: updatedNomination
    });

  } catch (error) {
    console.error('Nomination approval error:', error);
    
    if (error.message.includes('only update pending')) {
      return res.status(400).json({
        error: 'Invalid nomination status',
        details: 'Can only approve pending nominations'
      });
    }

    res.status(500).json({
      error: 'Failed to approve nomination'
    });
  }
});

/**
 * POST /moderation/nominations/:id/reject
 * Reject a nomination
 */
router.post('/nominations/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check moderation permissions
    if (!await permissionService.isModerator(memberId)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Moderation access required'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        error: 'Rejection reason is required'
      });
    }

    // Check if nomination exists
    const nomination = await nominationsService.getNomination(id);
    if (!nomination) {
      return res.status(404).json({
        error: 'Nomination not found'
      });
    }

    // Update nomination status
    const updatedNomination = await nominationsService.updateNominationStatus(
      id,
      'rejected',
      reason
    );

    // Log moderation action
    await moderationService.rejectContent('nomination', id, memberId, reason);

    res.json({
      status: 'rejected',
      nomination: updatedNomination
    });

  } catch (error) {
    console.error('Nomination rejection error:', error);
    
    if (error.message.includes('only update pending')) {
      return res.status(400).json({
        error: 'Invalid nomination status',
        details: 'Can only reject pending nominations'
      });
    }

    res.status(500).json({
      error: 'Failed to reject nomination'
    });
  }
});

/**
 * GET /moderation/nominations
 * Get nominations for moderation review
 */
router.get('/nominations', async (req, res) => {
  try {
    const { status } = req.query;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check moderation permissions
    if (!await permissionService.isModerator(memberId)) {
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
    console.error('Moderation nominations error:', error);
    res.status(500).json({
      error: 'Failed to retrieve nominations for moderation'
    });
  }
});

/**
 * GET /moderation/log
 * Get moderation activity log
 */
router.get('/log', async (req, res) => {
  try {
    const { contentType, contentId, limit, offset } = req.query;
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check moderation permissions
    if (!await permissionService.isModerator(memberId)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Moderation access required'
      });
    }

    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset, 10) : undefined;

    const moderationLog = await moderationService.getModerationLog({
      contentType,
      contentId,
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json({ moderationLog });

  } catch (error) {
    console.error('Moderation log error:', error);
    res.status(500).json({
      error: 'Failed to retrieve moderation log'
    });
  }
});

/**
 * GET /moderation/reports
 * Get pending content reports
 */
router.get('/reports', async (req, res) => {
  try {
    const memberId = req.member?.id;

    if (!memberId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Check moderation permissions
    if (!await permissionService.isModerator(memberId)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: 'Moderation access required'
      });
    }

    const reports = await moderationService.getPendingReports();
    res.json({ reports });

  } catch (error) {
    console.error('Pending reports error:', error);
    res.status(500).json({
      error: 'Failed to retrieve pending reports'
    });
  }
});

module.exports = router;
