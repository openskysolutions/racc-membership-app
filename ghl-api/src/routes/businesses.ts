/**
 * Businesses Routes
 * Member directory backed by GHL Business records + local BusinessProfile table.
 *
 * Public:
 *   GET  /businesses               — member directory listing
 *   GET  /businesses/:id           — single business profile
 *
 * Authenticated (isBusinessProfileEditor for own business, or admin):
 *   PATCH /businesses/:id          — update business profile
 *   GET   /businesses/:id/team     — list team members
 *   POST  /businesses/:id/team     — add a team member
 *   POST  /businesses/:id/team/:contactId/editor   — grant editor tag
 *   DELETE /businesses/:id/team/:contactId/editor  — revoke editor tag
 */

import express, { Request, Response } from 'express';
import { requireAuth } from '@/middleware/auth';
import { ghlService } from '@/services/gohighlevel';
import { emailService } from '@/services/emailService';
import { prisma } from '@/lib/prisma';
import { contactsCache } from '@/services/contactsCache';

const router = express.Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Merge a GHL Business object with its local BusinessProfile row. */
async function buildBusinessMember(business: any) {
  const profile = await prisma.businessProfile.findUnique({
    where: { ghlBusinessId: business.id },
  });

  const categories = profile
    ? await prisma.memberCategory.findMany({
        where: { ghlBusinessId: business.id },
        select: { subcategory: true },
      }).then(rows => rows.map(r => r.subcategory))
    : [];

  return {
    id: business.id,
    businessName: business.name,
    email: business.email ?? null,
    phone: business.phone ?? null,
    website: business.website ?? null,
    address1: business.address ?? null,
    city: business.city ?? null,
    state: business.state ?? null,
    postalCode: business.postalCode ?? null,
    country: business.country ?? null,
    bio: profile?.bio ?? business.description ?? null,
    tagline: profile?.tagline ?? null,
    avatar: profile?.avatar ?? null,
    coverImage: profile?.coverImage ?? null,
    membershipTier: profile?.membershipTier ?? null,
    memberSince: profile?.memberSince ?? null,
    couponCodes: profile?.couponCodes ?? [],
    specialties: profile?.specialties ?? [],
    organizationType: profile?.organizationType ?? null,
    facebookUrl: profile?.facebookUrl ?? null,
    instagramUrl: profile?.instagramUrl ?? null,
    twitterUrl: profile?.twitterUrl ?? null,
    linkedinUrl: profile?.linkedinUrl ?? null,
    hideMembershipTier: profile?.hideMembershipTier ?? false,
    categories,
  };
}

/** Permission check: user can edit this business. */
function canEditBusiness(req: Request, businessId: string): boolean {
  const u = req.user as any;
  if (!u) return false;
  if (u.role === 'admin') return true;
  return !!(u.isBusinessProfileEditor && u.ghlBusinessId === businessId);
}

/** Permission check: user is main contact or admin. */
function isMainContactOrAdmin(req: Request): boolean {
  const u = req.user as any;
  if (!u) return false;
  return u.role === 'admin' || !!u.isMainContact;
}

// ---------------------------------------------------------------------------
// GET /businesses
// ---------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, tier, city, categoryId } = req.query as Record<string, string>;

    // Fetch all GHL businesses (paginate internally up to 500)
    let allBusinesses: any[] = [];
    let skip = 0;
    while (true) {
      const batch = await ghlService.getBusinesses(100, skip);
      allBusinesses = allBusinesses.concat(batch);
      if (batch.length < 100) break;
      skip += 100;
    }

    // Join with BusinessProfile — only include businesses that have an active profile
    const profiles = await prisma.businessProfile.findMany({
      where: { membershipTier: { not: null } },
    });
    const profileMap = new Map(profiles.map(p => [p.ghlBusinessId, p]));

    // Keep only businesses with a membershipTier set (active members)
    let active = allBusinesses.filter(b => profileMap.has(b.id));

    // Apply filters
    if (search) {
      const q = search.toLowerCase();
      active = active.filter(b => b.name?.toLowerCase().includes(q));
    }
    if (tier) {
      active = active.filter(b => profileMap.get(b.id)?.membershipTier === tier);
    }
    if (city) {
      const q = city.toLowerCase();
      active = active.filter(b => b.city?.toLowerCase().includes(q));
    }

    // Category filter — join via MemberCategory
    if (categoryId) {
      const matched = await prisma.memberCategory.findMany({
        where: { subcategory: categoryId, ghlBusinessId: { not: null } },
        select: { ghlBusinessId: true },
      });
      const matchedIds = new Set(matched.map(r => r.ghlBusinessId));
      active = active.filter(b => matchedIds.has(b.id));
    }

    // Build response — fetch categories in bulk
    const businessIds = active.map(b => b.id);
    const categoryRows = await prisma.memberCategory.findMany({
      where: { ghlBusinessId: { in: businessIds } },
    });
    const catsByBusiness = new Map<string, string[]>();
    for (const row of categoryRows) {
      if (!row.ghlBusinessId) continue;
      if (!catsByBusiness.has(row.ghlBusinessId)) catsByBusiness.set(row.ghlBusinessId, []);
      catsByBusiness.get(row.ghlBusinessId)!.push(row.subcategory);
    }

    // Sort alphabetically by business name before building response
    active.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

    const members = active.map(b => {
      const profile = profileMap.get(b.id);
      return {
        id: b.id,
        businessName: b.name,
        email: b.email ?? null,
        phone: b.phone ?? null,
        website: b.website ?? null,
        address1: b.address ?? null,
        city: b.city ?? null,
        state: b.state ?? null,
        postalCode: b.postalCode ?? null,
        country: b.country ?? null,
        bio: profile?.bio ?? b.description ?? null,
        tagline: profile?.tagline ?? null,
        avatar: profile?.avatar ?? null,
        coverImage: profile?.coverImage ?? null,
        membershipTier: profile?.membershipTier ?? null,
        memberSince: profile?.memberSince ?? null,
        couponCodes: profile?.couponCodes ?? [],
        specialties: profile?.specialties ?? [],
        organizationType: profile?.organizationType ?? null,
        facebookUrl: profile?.facebookUrl ?? null,
        instagramUrl: profile?.instagramUrl ?? null,
        twitterUrl: profile?.twitterUrl ?? null,
        linkedinUrl: profile?.linkedinUrl ?? null,
        hideMembershipTier: profile?.hideMembershipTier ?? false,
        categories: catsByBusiness.get(b.id) ?? [],
      };
    });

    res.json({ members, total: members.length });
  } catch (err: any) {
    console.error('GET /businesses error:', err.message);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// ---------------------------------------------------------------------------
// GET /businesses/:id
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const business = await ghlService.getBusinessById(req.params.id);
    const member = await buildBusinessMember(business);
    res.json(member);
  } catch (err: any) {
    console.error(`GET /businesses/${req.params.id} error:`, err.message);
    res.status(404).json({ error: 'Business not found' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /businesses/:id
// ---------------------------------------------------------------------------
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!canEditBusiness(req, id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const {
      // GHL Business native fields
      businessName, name, email, phone, website, address1, address,
      city, state, postalCode, country,
      // Extended / BusinessProfile fields
      tagline, avatar, coverImage, bio,
      couponCodes, specialties, organizationType,
      facebookUrl, instagramUrl, twitterUrl, linkedinUrl,
      hideMembershipTier,
      // Categories (MemberCategory table, keyed by ghlBusinessId)
      categories,
    } = req.body;

    // Split into GHL fields and local profile fields
    const ghlFields: Record<string, any> = {};
    if (businessName !== undefined) ghlFields.name = businessName;
    if (name !== undefined) ghlFields.name = name;
    if (email !== undefined) ghlFields.email = email;
    if (phone !== undefined) ghlFields.phone = phone;
    if (website !== undefined) ghlFields.website = website;
    if (address1 !== undefined) ghlFields.address = address1;
    if (address !== undefined) ghlFields.address = address;
    if (city !== undefined) ghlFields.city = city;
    if (state !== undefined) ghlFields.state = state;
    if (postalCode !== undefined) ghlFields.postalCode = postalCode;
    if (country !== undefined) ghlFields.country = country;
    if (bio !== undefined) ghlFields.description = bio; // sync bio to GHL description

    const profileFields: Record<string, any> = {};
    if (tagline !== undefined) profileFields.tagline = tagline;
    if (avatar !== undefined) profileFields.avatar = avatar;
    if (coverImage !== undefined) profileFields.coverImage = coverImage;
    if (bio !== undefined) profileFields.bio = bio;
    if (couponCodes !== undefined) profileFields.couponCodes = couponCodes;
    if (specialties !== undefined) profileFields.specialties = specialties;
    if (organizationType !== undefined) profileFields.organizationType = organizationType;
    if (facebookUrl !== undefined) profileFields.facebookUrl = facebookUrl;
    if (instagramUrl !== undefined) profileFields.instagramUrl = instagramUrl;
    if (twitterUrl !== undefined) profileFields.twitterUrl = twitterUrl;
    if (linkedinUrl !== undefined) profileFields.linkedinUrl = linkedinUrl;
    if (hideMembershipTier !== undefined) profileFields.hideMembershipTier = hideMembershipTier;

    // Write to GHL if any native fields changed
    if (Object.keys(ghlFields).length > 0) {
      await ghlService.updateBusiness(id, ghlFields);
    }

    // Upsert BusinessProfile if any extended fields changed
    if (Object.keys(profileFields).length > 0) {
      await prisma.businessProfile.upsert({
        where: { ghlBusinessId: id },
        create: { ghlBusinessId: id, ...profileFields },
        update: profileFields,
      });
    }

    // Update categories (MemberCategory table, keyed by ghlBusinessId)
    if (categories !== undefined && Array.isArray(categories)) {
      if (categories.length > 3) {
        return res.status(400).json({ error: 'A maximum of 3 subcategories may be selected' });
      }
      await prisma.$transaction([
        prisma.memberCategory.deleteMany({ where: { ghlBusinessId: id } }),
        ...(categories.length > 0
          ? [prisma.memberCategory.createMany({
              data: categories.map((subcategory: string) => ({ ghlBusinessId: id, subcategory })),
            })]
          : []),
      ]);
    }

    const business = await ghlService.getBusinessById(id);
    const member = await buildBusinessMember(business);
    res.json(member);
  } catch (err: any) {
    console.error(`PATCH /businesses/${id} error:`, err.message);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

// ---------------------------------------------------------------------------
// GET /businesses/:id/team
// ---------------------------------------------------------------------------
router.get('/:id/team', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!canEditBusiness(req, id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Use shared contacts cache if warm — avoids a live GHL API call on every page load.
    // Fall back to live API if cache is cold OR returns empty (handles GHL propagation delay
    // right after a new contact is linked to this business).
    let contacts: any[];
    const cached = contactsCache.getByBusinessId(id);
    if (cached !== null && cached.length > 0) {
      contacts = cached;
    } else {
      contacts = await ghlService.getContactsByBusinessId(id);
    }

    const team = contacts.map((c: any) => ({
      id: c.id,
      firstName: c.firstName ?? null,
      lastName: c.lastName ?? null,
      email: c.email ?? null,
      phone: c.phone ?? null,
      title: c.title ?? null,
      tags: c.tags ?? [],
      isMainContact: Array.isArray(c.tags) && (c.tags.includes('main contact') || c.tags.includes('main-contact')),
      isEditor: Array.isArray(c.tags) && (c.tags.includes('business-profile-editor') || c.tags.includes('business profile editor') || c.tags.includes('main contact') || c.tags.includes('main-contact')),
    }));
    res.json({ team });
  } catch (err: any) {
    console.error(`GET /businesses/${id}/team error:`, err.message);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// ---------------------------------------------------------------------------
// POST /businesses/:id/team
// ---------------------------------------------------------------------------
router.post('/:id/team', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!canEditBusiness(req, id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { firstName, lastName, email, phone, title, grantEditorAccess } = req.body;
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'firstName, lastName, and email are required' });
  }

  const result: Record<string, any> = {};

  try {
    // Fetch the business up front so we can set companyName on the new contact
    const business = await ghlService.getBusinessById(id);

    // 1. Create GHL Contact
    const contactId = await ghlService.createContact({
      firstName, lastName, email, phone,
      companyName: business.name,
      locationId: ghlService.getLocationId(),
    } as any);
    result.contactId = contactId;

    // Set title via updateContact if provided
    if (title) {
      try {
        await ghlService.updateContact(contactId, { customFields: [] } as any);
      } catch { /* non-fatal */ }
    }

    // 2. Link contact to business
    try {
      await ghlService.linkContactToBusiness(contactId, id);
      result.associationStatus = 'linked';
    } catch (linkErr: any) {
      console.error(`Failed to link contact ${contactId} to business ${id}:`, linkErr.message);
      result.associationStatus = 'failed';
      result.associationMessage = 'Contact created; manual GHL association required';
    }

    // 3. Add 'active' tag
    await ghlService.updateContactTags(contactId, ['active'], 'add');

    // 4. Set Membership Start Date and Renewal Date from main contact's GHL record.
    //    Fall back to profile.memberSince / today if the main contact can't be read.
    const profile = await prisma.businessProfile.findUnique({ where: { ghlBusinessId: id } });
    const fallbackDate = profile?.memberSince ?? new Date().toISOString();

    let membershipStartDate: string = fallbackDate;
    let renewalDate: string = fallbackDate;
    try {
      const teamContacts = await ghlService.getContactsByBusinessId(id);
      const mainContactSummary = teamContacts.find((c: any) =>
        Array.isArray(c.tags) && (c.tags.includes('main contact') || c.tags.includes('main-contact'))
      );
      if (mainContactSummary) {
        const mainContact = await ghlService.getContact(mainContactSummary.id);
        const fields: any[] = mainContact?.customFields ?? mainContact?.customField ?? [];
        const findField = (fieldId: string) =>
          Array.isArray(fields) ? fields.find((f: any) => f.id === fieldId)?.value ?? null : null;
        membershipStartDate = findField('Dxt6gzc4osQhaCBPhslY') ?? fallbackDate;
        renewalDate         = findField('J3yL94KqDhUnjurcIG8G') ?? fallbackDate;
      }
    } catch (dateErr: any) {
      console.error('Failed to read dates from main contact, using fallback:', dateErr.message);
    }

    await ghlService.setContactCustomFields(contactId, [
      { id: 'Dxt6gzc4osQhaCBPhslY', field_value: membershipStartDate }, // Membership Start Date
      { id: 'J3yL94KqDhUnjurcIG8G', field_value: renewalDate },         // Renewal Date
    ]);

    // 5. Apply membership tier tag if business has one
    if (profile?.membershipTier) {
      await ghlService.updateContactTags(contactId, [`${profile.membershipTier} membership package`], 'add');
    }

    // 6. Grant editor access if requested and caller has permission
    if (grantEditorAccess && isMainContactOrAdmin(req)) {
      await ghlService.updateContactTags(contactId, ['business-profile-editor'], 'add');
      result.editorGranted = true;
    }

    // 7. Send invite email
    const emailSent = await emailService.sendInviteEmail(email, firstName, business.name);
    result.emailSent = emailSent;

    // Invalidate contacts cache so the team list reflects the new member immediately
    contactsCache.invalidate();

    res.status(201).json({ ...result, contact: { id: contactId, firstName, lastName, email } });
  } catch (err: any) {
    console.error(`POST /businesses/${id}/team error:`, err.message);
    res.status(500).json({ error: 'Failed to add team member', detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /businesses/:id/team/:contactId/editor  — grant editor tag
// ---------------------------------------------------------------------------
router.post('/:id/team/:contactId/editor', requireAuth, async (req: Request, res: Response) => {
  if (!isMainContactOrAdmin(req)) {
    return res.status(403).json({ error: 'Only the main contact or an admin can grant editor access' });
  }

  try {
    await ghlService.updateContactTags(req.params.contactId, ['business-profile-editor'], 'add');
    res.json({ success: true });
  } catch (err: any) {
    console.error(`POST /businesses/${req.params.id}/team/${req.params.contactId}/editor error:`, err.message);
    res.status(500).json({ error: 'Failed to grant editor access' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /businesses/:id/team/:contactId/editor  — revoke editor tag
// ---------------------------------------------------------------------------
router.delete('/:id/team/:contactId/editor', requireAuth, async (req: Request, res: Response) => {
  if (!isMainContactOrAdmin(req)) {
    return res.status(403).json({ error: 'Only the main contact or an admin can revoke editor access' });
  }

  try {
    await ghlService.updateContactTags(req.params.contactId, ['business-profile-editor'], 'remove');
    res.json({ success: true });
  } catch (err: any) {
    console.error(`DELETE /businesses/${req.params.id}/team/${req.params.contactId}/editor error:`, err.message);
    res.status(500).json({ error: 'Failed to revoke editor access' });
  }
});

export default router;
