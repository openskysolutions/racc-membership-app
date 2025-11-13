/**
 * Admin Routes for RACC Membership Portal
 * Admin-only routes for user management and system administration
 */

import express from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';
import { databaseService } from '@/services/database';
import { enrichUsersWithGhlData, enrichUserWithGhlData } from '@/services/userEnrichment';

const router = express.Router();

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 200
 *         description: Number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of users to skip for pagination
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, moderator, member]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, pending, suspended]
 *         description: Filter by user status
 *     responses:
 *       200:
 *         description: List of users with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      search = '', 
      role = '', 
      status = '' 
    } = req.query;

    // Get users from database (auth fields only)
    const dbUsers = await databaseService.getAllUsers(
      parseInt(limit as string), 
      parseInt(offset as string)
    );

    // Enrich users with profile data from GoHighLevel
    const users = await enrichUsersWithGhlData(dbUsers);

    // Filter users based on search criteria
    let filteredUsers = users;
    
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.businessName && user.businessName.toLowerCase().includes(searchTerm))
      );
    }

    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    // EnrichedUser type already excludes passwordHash, so users are safe to return
    const safeUsers = filteredUsers;

    // Get total count for pagination
    const total = safeUsers.length;
    const hasMore = (parseInt(offset as string) + parseInt(limit as string)) < total;

    res.json({
      users: safeUsers,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore
      }
    });

  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      error: 'Failed to retrieve users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user details (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               businessName:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, moderator, member]
 *               status:
 *                 type: string
 *                 enum: [active, pending, suspended]
 *               membershipTier:
 *                 type: string
 *                 enum: [standard, enhanced, elite]
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, cancelled]
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updates = req.body;

    // Validate user exists
    const existingUser = await databaseService.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Prevent admin from demoting themselves
    if (userId === parseInt(req.user.id) && updates.role && updates.role !== 'admin') {
      return res.status(400).json({
        error: 'Cannot change your own admin role',
        details: 'Admins cannot demote themselves'
      });
    }

    // Validate email uniqueness if email is being changed
    if (updates.email && updates.email !== existingUser.email) {
      const emailExists = await databaseService.getUserByEmail(updates.email);
      if (emailExists) {
        return res.status(400).json({
          error: 'Email already exists',
          details: 'Another user is already using this email address'
        });
      }
    }

    // Update user in database
    await databaseService.updateUser(userId, updates);

    // Get updated user
    const updatedUser = await databaseService.getUserById(userId);
    const { passwordHash, ...safeUser } = updatedUser;

    res.json({
      message: 'User updated successfully',
      user: safeUser
    });

  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Update user status (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, pending, suspended]
 *               reason:
 *                 type: string
 *                 description: Optional reason for status change
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/users/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { status, reason } = req.body;

    if (!status || !['active', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        details: 'Status must be one of: active, pending, suspended'
      });
    }

    // Validate user exists
    const existingUser = await databaseService.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Prevent admin from suspending themselves
    if (userId === parseInt(req.user.id) && status === 'suspended') {
      return res.status(400).json({
        error: 'Cannot suspend your own account',
        details: 'Admins cannot suspend themselves'
      });
    }

    // Update user status
    await databaseService.updateUserStatus(userId, status);

    // Log the status change (optional)
    console.log(`Admin ${req.user.email} changed user ${existingUser.email} status to ${status}${reason ? ` (reason: ${reason})` : ''}`);

    res.json({
      message: 'User status updated successfully',
      userId,
      status,
      reason: reason || null
    });

  } catch (error) {
    console.error('Admin update user status error:', error);
    res.status(500).json({
      error: 'Failed to update user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user account (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Validate user exists
    const dbUser = await databaseService.getUserById(userId);
    if (!dbUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Enrich for display name
    const existingUser = await enrichUserWithGhlData(dbUser);

    // Prevent admin from deleting themselves
    if (userId === parseInt(req.user.id)) {
      return res.status(400).json({
        error: 'Cannot delete your own account',
        details: 'Admins cannot delete themselves'
      });
    }

    // Delete user
    await databaseService.deleteUser(userId);

    // Log the deletion
    console.log(`Admin ${req.user.email} deleted user ${existingUser.email} (ID: ${userId})`);

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: userId,
        email: existingUser.email,
        name: `${existingUser.firstName || ''} ${existingUser.lastName || ''}`.trim() || existingUser.email
      }
    });

  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get system statistics (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     pending:
 *                       type: integer
 *                     suspended:
 *                       type: integer
 *                     byRole:
 *                       type: object
 *                       properties:
 *                         admin:
 *                           type: integer
 *                         moderator:
 *                           type: integer
 *                         member:
 *                           type: integer
 *                     byMembershipTier:
 *                       type: object
 *                       properties:
 *                         standard:
 *                           type: integer
 *                         enhanced:
 *                           type: integer
 *                         elite:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Get all users from database (auth fields only)
    const dbUsers = await databaseService.getAllUsers(1000, 0); // Get all users
    
    // Enrich users with profile data from GoHighLevel for membership tier stats
    const users = await enrichUsersWithGhlData(dbUsers);

    const stats = {
      users: {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        pending: users.filter(u => u.status === 'pending').length,
        suspended: users.filter(u => u.status === 'suspended').length,
        byRole: {
          admin: users.filter(u => u.role === 'admin').length,
          moderator: users.filter(u => u.role === 'moderator').length,
          board_member: users.filter(u => u.role === 'board_member').length,
          member: users.filter(u => u.role === 'member').length
        },
        byMembershipTier: {
          standard: users.filter(u => u.membershipTier === 'standard').length,
          enhanced: users.filter(u => u.membershipTier === 'enhanced').length,
          elite: users.filter(u => u.membershipTier === 'elite').length
        }
      }
    };

    res.json(stats);

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;