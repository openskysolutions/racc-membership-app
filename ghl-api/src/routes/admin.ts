/**
 * Admin Routes for RACC Membership Portal
 * Admin-only routes for user management and system administration
 */

import express from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';
import { databaseService } from '@/services/database';
import { enrichUsersWithGhlData, enrichUserWithGhlData, getMembershipTierStats } from '@/services/userEnrichment';
import { ghlService } from '@/services/gohighlevel';
import { emailService } from '@/services/emailService';
import { prisma } from '@/lib/prisma';

import { contactsCache, businessesCache } from '@/services/contactsCache';

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
      status = '',
      sort = ''
    } = req.query;

    const searchTerm = (search as string).toLowerCase();
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Fetch ALL users from DB so we can filter in memory and return an accurate total.
    // We use DB-only enrichment (no GHL calls) to avoid N parallel contact fetches that
    // would flood the GHL rate limit.
    const dbUsers = await databaseService.getAllUsers();
    const users = await enrichUsersWithGhlData(dbUsers, false); // DB data only — zero GHL calls

    // Populate contacts cache if cold, then cross-reference to add names without extra GHL calls
    if (!contactsCache.isFresh()) {
      const fetched = await ghlService.getAllContacts();
      contactsCache.set(fetched);
    }
    const contactNameMap = new Map(
      contactsCache.get()!.map((c: any) => [c.id, {
        firstName: c.firstName,
        lastName: c.lastName,
        businessName: c.companyName || c.businessName || null,
      }])
    );
    for (const user of users) {
      if (user.ghlContactId && !user.firstName && !user.lastName) {
        const contact = contactNameMap.get(user.ghlContactId);
        if (contact) {
          user.firstName = contact.firstName || '';
          user.lastName = contact.lastName || '';
          if (!user.businessName) user.businessName = contact.businessName || '';
        }
      }
    }

    // Filter users based on search criteria
    let filteredUsers = users;
    
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(searchTerm) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
        (user.firstName && user.lastName && 
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm))
      );
    }

    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    if (sort === 'firstName') {
      filteredUsers.sort((a, b) => {
        const aName = (a.firstName || '').trim();
        const bName = (b.firstName || '').trim();
        if (!aName && bName) return 1;
        if (aName && !bName) return -1;
        return aName.localeCompare(bName);
      });
    } else if (sort === 'businessName') {
      filteredUsers.sort((a, b) => {
        const aName = (a.businessName || '').trim();
        const bName = (b.businessName || '').trim();
        if (!aName && bName) return 1;
        if (aName && !bName) return -1;
        return aName.localeCompare(bName);
      });
    }

    // Paginate the filtered result so total and hasMore are accurate
    const total = filteredUsers.length;
    const pageUsers = filteredUsers.slice(offsetNum, offsetNum + limitNum);
    const hasMore = offsetNum + limitNum < total;

    res.json({
      users: pageUsers,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
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
    const dbUsers = await databaseService.getAllUsers(1000, 0);

    // Calculate stats from database only - fast!
    // Membership tier stats calculated on frontend from users list
    const stats = {
      users: {
        total: dbUsers.length,
        active: dbUsers.filter(u => u.status === 'active').length,
        pending: dbUsers.filter(u => u.status === 'pending').length,
        suspended: dbUsers.filter(u => u.status === 'suspended').length,
        byRole: {
          admin: dbUsers.filter(u => u.role === 'admin').length,
          moderator: dbUsers.filter(u => u.role === 'moderator').length,
          board_member: dbUsers.filter(u => u.role === 'board_member').length,
          member: dbUsers.filter(u => u.role === 'member').length
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

// ---------------------------------------------------------------------------
// Business membership admin endpoints
// ---------------------------------------------------------------------------

/**
 * GET /admin/businesses
 * List all GHL Businesses with their BusinessProfile data (paginated).
 */
router.get('/businesses', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { search, tier, city, state, status, renewal, limit = '500', offset = '0' } = req.query as Record<string, string>;
    const lim = parseInt(limit) || 500;
    const off = parseInt(offset) || 0;

    // Fetch all business records with custom fields via Objects API
    let allBusinesses = await ghlService.getAllBusinessRecords();

    // Apply filters
    if (search) {
      const q = search.toLowerCase();
      allBusinesses = allBusinesses.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q)
      );
    }

    if (tier) {
      allBusinesses = allBusinesses.filter((b: any) => {
        const raw = (b.customFields ?? []).find((f: any) => f.key === 'membership_tier');
        const val: string | null = raw?.valueString ?? null;
        const slug = val ? val.replace('_membership_package', '') : null;
        return slug === tier;
      });
    }
    if (city) allBusinesses = allBusinesses.filter((b: any) => b.city?.toLowerCase().includes(city.toLowerCase()));
    if (state) allBusinesses = allBusinesses.filter((b: any) => b.state?.toLowerCase() === state.toLowerCase());

    if (status && status !== 'all') {
      allBusinesses = allBusinesses.filter((b: any) => {
        const s = (b.customFields ?? []).find((f: any) => f.key === 'membership_status')?.valueString ?? null;
        return status === 'active' ? s === 'active' : s !== 'active';
      });
    }

    if (renewal && renewal !== 'all') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const cutoff = new Date(today); cutoff.setMonth(cutoff.getMonth() - 13);
      const in60 = new Date(today); in60.setDate(in60.getDate() + 60);
      allBusinesses = allBusinesses.filter((b: any) => {
        const raw = (b.customFields ?? []).find((f: any) => f.key === 'renewal_date')?.valueString ?? null;
        if (!raw) return renewal === 'none';
        const d = new Date(raw);
        if (renewal === 'expired') return d < cutoff;
        if (renewal === 'expiring') return d >= today && d <= in60;
        if (renewal === 'current') return d > in60;
        return true;
      });
    }

    allBusinesses.sort((a: any, b: any) => (a.name ?? '').localeCompare(b.name ?? ''));

    const total = allBusinesses.length;
    const page = allBusinesses.slice(off, off + lim);

    // Count app users per business from DB (avoids N×GHL API calls)
    const userCounts = await prisma.user.groupBy({
      by: ['ghlBusinessId'],
      _count: { id: true },
      where: { ghlBusinessId: { not: null } }
    });
    const userCountMap = new Map(userCounts.map(u => [u.ghlBusinessId!, u._count.id]));

    // Main contacts per business — source of truth is GHL tag 'main-contact'.
    // Populate the contacts cache now if it's cold (shared with the contacts endpoint).
    if (!contactsCache.isFresh()) {
      const fetched = await ghlService.getAllContacts();
      contactsCache.set(fetched);
    }

    const mainContactMap = new Map<string, string>();
    const firstContactMap = new Map<string, string>();
    for (const c of contactsCache.get()!) {
      const bizId = c.businessId || c.business_id;
      if (!bizId) continue;
      const name = (c.firstName || c.lastName)
        ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()
        : (c.email ?? null);
      if (!name) continue;
      // Track first contact per business as fallback
      if (!firstContactMap.has(bizId)) firstContactMap.set(bizId, name);
      // Prefer contacts tagged as main contact
      const isMain = Array.isArray(c.tags) &&
        (c.tags.includes('main contact') || c.tags.includes('main-contact'));
      if (isMain) mainContactMap.set(bizId, name);
    }

    const businesses = page.map((b: any) => {
      const tierRaw = (b.customFields ?? []).find((f: any) => f.key === 'membership_tier');
      const tierVal: string | null = tierRaw?.valueString ?? null;
      const membershipTier = tierVal ? tierVal.replace('_membership_package', '') : null;
      const memberSince = (b.customFields ?? []).find((f: any) => f.key === 'membership_start_date')?.valueString ?? null;
      const renewalDate = (b.customFields ?? []).find((f: any) => f.key === 'renewal_date')?.valueString ?? null;
      const membershipStatus = (b.customFields ?? []).find((f: any) => f.key === 'membership_status')?.valueString ?? null;
      return {
        id: b.id,
        businessName: b.name,
        email: b.email ?? null,
        phone: b.phone ?? null,
        city: b.city ?? null,
        state: b.state ?? null,
        membershipTier,
        memberSince,
        renewalDate,
        membershipStatus,
        appUserCount: userCountMap.get(b.id) ?? 0,
        mainContactName: mainContactMap.get(b.id) ?? firstContactMap.get(b.id) ?? null,
      };
    });

    res.json({ businesses, total });
  } catch (err: any) {
    console.error('GET /admin/businesses error:', err.message);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

/**
 * PATCH /admin/businesses/:id/tier
 * Set membership tier (and optionally memberSince) on a BusinessProfile.
 */
router.patch('/businesses/:id/tier', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { tier, memberSince, renewalDate } = req.body;

  const validTiers = ['basic', 'enhanced', 'elite', null];
  if (!validTiers.includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier value' });
  }

  // All possible tier package tags in GHL
  const ALL_TIER_TAGS = [
    'basic membership package',
    'enhanced membership package',
    'elite membership package',
  ];
  const TIER_TAG_MAP: Record<string, string> = {
    basic: 'basic membership package',
    enhanced: 'enhanced membership package',
    elite: 'elite membership package',
    // 'standard' has no corresponding GHL tag — selecting it just removes existing tier tags
  };

  try {
    // 1. Write tier and memberSince to GHL business custom properties
    const ghlTierValue = tier ? `${tier}_membership_package` : null;
    const bizProps: Record<string, string | null> = {
      membership_tier: ghlTierValue,
      membership_status: tier ? 'active' : null,
    };
    if (memberSince !== undefined) bizProps.membership_start_date = memberSince ?? null;
    // renewal_date: use explicitly passed value, default to today when activating,
    // or clear when removing a tier
    if (renewalDate !== undefined) {
      bizProps.renewal_date = renewalDate ?? null;
    } else if (tier) {
      bizProps.renewal_date = new Date().toISOString().split('T')[0];
    } else {
      bizProps.renewal_date = null;
    }
    await ghlService.updateBusinessProperties(id, bizProps);

    // 2. Update GHL tags on ALL contacts associated with this business
    // Get contacts from cache first, fall back to direct GHL fetch
    let bizContacts: any[] = [];
    if (contactsCache.isFresh()) {
      bizContacts = contactsCache.get()!.filter((c: any) =>
        c.businessId === id || c.business_id === id
      );
    }
    if (bizContacts.length === 0) {
      bizContacts = await ghlService.getContactsByBusinessId(id);
    }

    let updatedCount = 0;
    for (const contact of bizContacts) {
      try {
        await ghlService.updateContactTags(contact.id, ALL_TIER_TAGS, 'remove');
        if (tier && TIER_TAG_MAP[tier]) {
          await ghlService.updateContactTags(contact.id, [TIER_TAG_MAP[tier]], 'add');
        }
        updatedCount++;
      } catch (tagErr: any) {
        console.warn(`[tier update] Failed to update tags on contact ${contact.id}:`, tagErr.message);
      }
    }

    // Invalidate caches so next load reflects new tags
    if (updatedCount > 0) contactsCache.invalidate();
    businessesCache.invalidate();

    console.log(`[tier update] business ${id} → ${tier ?? 'none'} | updated ${updatedCount}/${bizContacts.length} contacts`);

    res.json({ success: true, ghlBusinessId: id, membershipTier: tier, memberSince, contactsUpdated: updatedCount });
  } catch (err: any) {
    console.error(`PATCH /admin/businesses/${id}/tier error:`, err.message);
    res.status(500).json({ error: 'Failed to update tier' });
  }
});

/**
 * GET /admin/contacts
 * List GHL contacts that have a businessId set.
 * Supports ?search=, ?businessId=, ?tag=, ?limit=, ?offset=
 */
router.get('/contacts', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Fetch contacts from GHL (sequential pagination — not parallel, so no rate limiting).
    // Results are cached in memory for 5 minutes; pass ?refresh=true to force re-fetch.
    const { search, tag, limit = '500', offset = '0', refresh, sort } = req.query as Record<string, string>;
    const lim = parseInt(limit) || 500;
    const off = parseInt(offset) || 0;

    let ghlContacts: any[];
    if (!refresh && contactsCache.isFresh()) {
      ghlContacts = contactsCache.get()!;
    } else {
      ghlContacts = await ghlService.getAllContacts();
      contactsCache.set(ghlContacts);
    }

    // One DB query for hasAppAccount + isMainContact + isEditor
    const ghlContactIds = ghlContacts.map((c: any) => c.id).filter(Boolean);
    const dbUsers = await prisma.user.findMany({
      where: { ghlContactId: { in: ghlContactIds } },
      select: { ghlContactId: true, isMainContact: true, isBusinessProfileEditor: true },
    });
    const dbMap = new Map(dbUsers.map(u => [u.ghlContactId, u]));

    // Filter in memory — always restrict to contacts linked to a GHL Business
    let filtered: any[] = ghlContacts.filter((c: any) => !!(c.businessId || c.business_id));
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c: any) =>
        c.email?.toLowerCase().includes(q) ||
        c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q)
      );
    }
    if (tag === 'main-contact') {
      filtered = filtered.filter((c: any) =>
        Array.isArray(c.tags) && (c.tags.includes('main contact') || c.tags.includes('main-contact'))
      );
    } else if (tag === 'business-profile-editor') {
      filtered = filtered.filter((c: any) => dbMap.get(c.id)?.isBusinessProfileEditor);
    }

    if (sort === 'firstName') {
      filtered.sort((a: any, b: any) => {
        const aName = (a.firstName || '').trim();
        const bName = (b.firstName || '').trim();
        if (!aName && bName) return 1;
        if (aName && !bName) return -1;
        return aName.localeCompare(bName);
      });
    } else if (sort === 'businessName') {
      filtered.sort((a: any, b: any) => {
        const aName = (a.companyName || a.businessName || '').trim();
        const bName = (b.companyName || b.businessName || '').trim();
        if (!aName && bName) return 1;
        if (aName && !bName) return -1;
        return aName.localeCompare(bName);
      });
    }

    const total = filtered.length;
    const contacts = filtered.slice(off, off + lim).map((c: any) => {
      const db = dbMap.get(c.id);
      return {
        id: c.id,
        firstName: c.firstName ?? null,
        lastName: c.lastName ?? null,
        email: c.email ?? null,
        phone: c.phone ?? null,
        businessId: c.businessId ?? null,
        businessName: c.companyName || c.businessName || null,
        isMainContact: Array.isArray(c.tags) && (c.tags.includes('main contact') || c.tags.includes('main-contact')),
        isEditor: Array.isArray(c.tags) && (c.tags.includes('business-profile-editor') || c.tags.includes('business-profile editor') || c.tags.includes('main contact') || c.tags.includes('main-contact')),
        hasAppAccount: !!db,
      };
    });

    res.json({ contacts, total });
  } catch (err: any) {
    console.error('GET /admin/contacts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

/**
 * POST /admin/contacts/:contactId/tags
 * Add or remove a tag on a GHL Contact.
 * Body: { tag: string, action: 'add' | 'remove' }
 */
router.post('/contacts/:contactId/tags', requireAuth, requireAdmin, async (req, res) => {
  const { contactId } = req.params;
  const { tag, action } = req.body;

  if (!tag || !['add', 'remove'].includes(action)) {
    return res.status(400).json({ error: 'tag and action (add|remove) are required' });
  }

  try {
    await ghlService.updateContactTags(contactId, [tag], action);

    // Sync the corresponding DB User fields so the contacts list stays consistent
    const dbUpdate: any = {};
    if (tag === 'main-contact') dbUpdate.isMainContact = action === 'add';
    if (tag === 'business-profile-editor') dbUpdate.isBusinessProfileEditor = action === 'add';
    if (Object.keys(dbUpdate).length > 0) {
      await prisma.user.updateMany({ where: { ghlContactId: contactId }, data: dbUpdate });
    }

    res.json({ success: true, contactId, tag, action });
  } catch (err: any) {
    console.error(`POST /admin/contacts/${contactId}/tags error:`, err.message);
    res.status(500).json({ error: 'Failed to update contact tags' });
  }
});

/**
 * POST /admin/contacts/:contactId/set-main-contact
 * Atomically set a contact as the main contact for its business:
 *   1. Remove 'main contact' tag from all other contacts in the same business.
 *   2. Add 'main contact' tag to this contact.
 */
router.post('/contacts/:contactId/set-main-contact', requireAuth, requireAdmin, async (req, res) => {
  const { contactId } = req.params;

  try {
    // Fetch the contact to get its businessId
    const contact = await ghlService.getContact(contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const businessId = contact.businessId || contact.business_id;

    // If the contact belongs to a business, strip the tag from all current main contacts
    if (businessId && contactsCache.isFresh()) {
      const siblings = contactsCache.get()!.filter(
        (c: any) => (c.businessId || c.business_id) === businessId && c.id !== contactId
      );
      const currentMains = siblings.filter(
        (c: any) => Array.isArray(c.tags) && (c.tags.includes('main contact') || c.tags.includes('main-contact'))
      );
      await Promise.all(
        currentMains.map((c: any) => ghlService.updateContactTags(c.id, ['main contact'], 'remove'))
      );
      // Update DB for demoted contacts
      if (currentMains.length > 0) {
        await prisma.user.updateMany({
          where: { ghlContactId: { in: currentMains.map((c: any) => c.id) } },
          data: { isMainContact: false },
        });
      }
    }

    // Now promote this contact
    await ghlService.updateContactTags(contactId, ['main contact'], 'add');
    await prisma.user.updateMany({ where: { ghlContactId: contactId }, data: { isMainContact: true } });

    // Invalidate cache so next load reflects changes
    contactsCache.invalidate();

    res.json({ success: true, contactId, businessId });
  } catch (err: any) {
    console.error(`POST /admin/contacts/${contactId}/set-main-contact error:`, err.message);
    res.status(500).json({ error: 'Failed to set main contact' });
  }
});

/**
 * POST /admin/memberships
 * Create a full membership in one operation: GHL Contact + GHL Business + link + tags + invite email.
 */
router.post('/memberships', requireAuth, requireAdmin, async (req, res) => {
  const { contact: contactData, business: businessData } = req.body;

  if (!contactData?.firstName || !contactData?.lastName || !contactData?.email || !businessData?.name || !businessData?.membershipTier) {
    return res.status(400).json({ error: 'contact.firstName, lastName, email, business.name, and business.membershipTier are required' });
  }

  const result: Record<string, any> = {};
  let contactId: string | null = null;
  let businessId: string | null = null;

  try {
    // Step 1: Create GHL Contact
    contactId = await ghlService.createContact({
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone,
      locationId: ghlService.getLocationId(),
    } as any);
    result.contactId = contactId;
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create GHL contact', detail: err.message });
  }

  try {
    // Step 2: Create GHL Business
    const business = await ghlService.createBusiness({
      name: businessData.name,
      email: businessData.email,
      phone: businessData.phone,
      website: businessData.website,
      address: businessData.address,
      city: businessData.city,
      state: businessData.state,
      postalCode: businessData.postalCode,
    });
    businessId = business.id;
    result.businessId = businessId;
  } catch (err: any) {
    // Roll back: delete the contact we just created
    try { await ghlService.deleteContact(contactId!); } catch { /* best effort */ }
    return res.status(500).json({ error: 'Failed to create GHL business', detail: err.message });
  }

  // Step 3: Link contact to business (non-fatal)
  try {
    await ghlService.linkContactToBusiness(contactId!, businessId!);
    result.associationStatus = 'linked';
  } catch (err: any) {
    console.error(`Failed to link contact ${contactId} to business ${businessId}:`, err.message);
    result.associationStatus = 'failed';
    result.associationMessage = 'Contact and business created; manual GHL association required';
  }

  // Steps 4–8: tags, custom fields, profile — non-fatal individually
  try { await ghlService.updateContactTags(contactId!, ['active'], 'add'); } catch (e: any) { console.error('Step 4 failed:', e.message); }

  // Step 4b: set companyName on contact now that the business exists
  try { await ghlService.updateContact(contactId!, { companyName: businessData.name } as any); } catch (e: any) { console.error('Step 4b failed:', e.message); }

  const today = businessData.memberSince || new Date().toISOString();
  try {
    await ghlService.setContactCustomFields(contactId!, [
      { id: 'Dxt6gzc4osQhaCBPhslY', field_value: today }, // Membership Start Date
      { id: 'J3yL94KqDhUnjurcIG8G', field_value: today }, // Renewal Date
    ]);
  } catch (e: any) { console.error('Step 5 failed:', e.message); }

  if (businessData.membershipTier) {
    try { await ghlService.updateContactTags(contactId!, [`${businessData.membershipTier} membership package`], 'add'); } catch (e: any) { console.error('Step 6 failed:', e.message); }
  }

  if (contactData.isMainContact) {
    try { await ghlService.updateContactTags(contactId!, ['main contact'], 'add'); } catch (e: any) { console.error('Step 7 failed:', e.message); }
  }

  if (businessData.membershipTier) {
    try {
      await ghlService.updateBusinessProperties(businessId!, {
        membership_tier: `${businessData.membershipTier}_membership_package`,
        membership_start_date: businessData.memberSince ?? null,
        renewal_date: today,
        membership_status: 'active',
      });
    } catch (e: any) { console.error('Step 8 failed:', e.message); }
  }

  // Step 9: Send invite email (non-fatal)
  const emailSent = await emailService.sendInviteEmail(
    contactData.email, contactData.firstName, businessData.name
  ).catch(() => false);
  result.emailSent = emailSent;

  // Invalidate caches so admin tabs reflect the new contact and business immediately
  contactsCache.invalidate();
  businessesCache.invalidate();

  res.status(201).json(result);
});

export default router;