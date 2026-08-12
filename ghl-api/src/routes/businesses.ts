/**
 * Businesses Routes
 * Member directory backed by GHL Business records.
 * Extended profile data (logo, tagline, social links, etc.) is stored as
 * custom fields directly on the GHL Business object via the Objects API.
 * The MemberCategory table remains in Postgres (no GHL equivalent).
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
import { contactsCache, businessesCache } from '@/services/contactsCache';

const router = express.Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read a custom field value from a GHL Business object's customFields array.
 * GHL returns { key, valueString } for text/select fields and { key, valueDate }
 * for date fields. Returns null when the field is not set.
 */
function getBusinessProp(business: any, key: string): string | null {
  const field = (business.customFields ?? []).find((f: any) => f.key === key);
  return field?.valueString ?? field?.valueDate ?? null;
}

/**
 * Parse the membership_tier GHL value to our short slug.
 * GHL stores "enhanced_membership_package"; we expose "enhanced".
 */
function parseTierSlug(raw: string | null): string | null {
  if (!raw) return null;
  return raw.replace('_membership_package', '') || null;
}

/** Build the standard member response shape from a GHL Business object. */
async function buildBusinessMember(business: any) {
  const categories = await prisma.memberCategory.findMany({
    where: { ghlBusinessId: business.id },
    select: { subcategory: true },
  }).then(rows => rows.map(r => r.subcategory));

  let couponCodes: string[] = [];
  try { couponCodes = JSON.parse(getBusinessProp(business, 'coupon_codes') ?? '[]'); } catch { couponCodes = []; }

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
    bio: business.description ?? null,
    tagline: getBusinessProp(business, 'tagline'),
    avatar: getBusinessProp(business, 'logo_url'),
    coverImage: getBusinessProp(business, 'cover_image_url'),
    membershipTier: parseTierSlug(getBusinessProp(business, 'membership_tier')),
    memberSince: getBusinessProp(business, 'membership_start_date'),
    couponCodes,
    specialties: [],
    organizationType: getBusinessProp(business, 'organization_type'),
    facebookUrl: getBusinessProp(business, 'facebook_url'),
    instagramUrl: getBusinessProp(business, 'instagram_url'),
    twitterUrl: getBusinessProp(business, 'twitter_url'),
    linkedinUrl: getBusinessProp(business, 'linkedin_url'),
    hideMembershipTier: getBusinessProp(business, 'hide_membership_tier') === 'true',
    categories,
  };
}

/** Permission check: user can edit this business. */
function canEditBusiness(req: Request, businessId: string): boolean {
  const u = req.user as any;
  if (!u) return false;
  if (u.role === 'admin') return true;
  const hasEditRole = !!(u.isMainContact || u.isBusinessProfileEditor);
  return hasEditRole && u.ghlBusinessId === businessId;
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

    // Fetch all business records with properties via Objects API (2 calls for ~145 records)
    const allBusinesses = await ghlService.getAllBusinessRecords();

    // Active members = businesses with membership_tier set, status active,
    // and a renewal date within the last 13 months.
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 13);

    let active = allBusinesses.filter(b => {
      if (!getBusinessProp(b, 'membership_tier')) return false;
      if (getBusinessProp(b, 'membership_status') !== 'active') return false;
      const renewal = getBusinessProp(b, 'renewal_date');
      return !!renewal && new Date(renewal) >= cutoff;
    });

    // Apply filters
    if (search) {
      const q = search.toLowerCase();
      active = active.filter(b => b.name?.toLowerCase().includes(q));
    }
    if (tier) {
      active = active.filter(b => parseTierSlug(getBusinessProp(b, 'membership_tier')) === tier);
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

    // Build team members map from contacts cache (falls back to live API if cold)
    const businessIdSet = new Set(businessIds);
    const allContacts: any[] = contactsCache.get() ?? await ghlService.getAllContacts();
    const teamByBusiness = new Map<string, Array<{ firstName: string | null; lastName: string | null; email: string | null; title: string | null }>>();
    for (const c of allContacts) {
      if (!c.businessId || !businessIdSet.has(c.businessId)) continue;
      if (!teamByBusiness.has(c.businessId)) teamByBusiness.set(c.businessId, []);
      teamByBusiness.get(c.businessId)!.push({
        firstName: c.firstName ?? null,
        lastName: c.lastName ?? null,
        email: c.email ?? null,
        title: c.title ?? null,
      });
    }

    // Sort alphabetically by business name before building response
    active.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

    const members = active.map(b => {
      let couponCodes: string[] = [];
      try { couponCodes = JSON.parse(getBusinessProp(b, 'coupon_codes') ?? '[]'); } catch { couponCodes = []; }
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
        bio: b.description ?? null,
        tagline: getBusinessProp(b, 'tagline'),
        avatar: getBusinessProp(b, 'logo_url'),
        coverImage: getBusinessProp(b, 'cover_image_url'),
        membershipTier: parseTierSlug(getBusinessProp(b, 'membership_tier')),
        memberSince: getBusinessProp(b, 'membership_start_date'),
        couponCodes,
        specialties: [],
        organizationType: getBusinessProp(b, 'organization_type'),
        facebookUrl: getBusinessProp(b, 'facebook_url'),
        instagramUrl: getBusinessProp(b, 'instagram_url'),
        twitterUrl: getBusinessProp(b, 'twitter_url'),
        linkedinUrl: getBusinessProp(b, 'linkedin_url'),
        hideMembershipTier: getBusinessProp(b, 'hide_membership_tier') === 'true',
        categories: catsByBusiness.get(b.id) ?? [],
        teamMembers: teamByBusiness.get(b.id) ?? [],
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
      // Extended profile fields — written to GHL business custom properties
      tagline, avatar, coverImage, bio,
      couponCodes, organizationType,
      facebookUrl, instagramUrl, twitterUrl, linkedinUrl,
      hideMembershipTier,
      // Categories (MemberCategory table, keyed by ghlBusinessId)
      categories,
    } = req.body;

    // Split into GHL native fields and custom property fields
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
    if (bio !== undefined) ghlFields.description = bio; // bio maps to GHL native description

    const customProps: Record<string, string | null> = {};
    if (tagline !== undefined) customProps.tagline = tagline ?? null;
    if (avatar !== undefined) customProps.logo_url = avatar ?? null;
    if (coverImage !== undefined) customProps.cover_image_url = coverImage ?? null;
    if (couponCodes !== undefined) customProps.coupon_codes = JSON.stringify(couponCodes ?? []);
    if (organizationType !== undefined) customProps.organization_type = organizationType ?? null;
    if (facebookUrl !== undefined) customProps.facebook_url = facebookUrl ?? null;
    if (instagramUrl !== undefined) customProps.instagram_url = instagramUrl ?? null;
    if (twitterUrl !== undefined) customProps.twitter_url = twitterUrl ?? null;
    if (linkedinUrl !== undefined) customProps.linkedin_url = linkedinUrl ?? null;
    if (hideMembershipTier !== undefined) customProps.hide_membership_tier = String(hideMembershipTier);

    // Write to GHL
    if (Object.keys(ghlFields).length > 0) {
      await ghlService.updateBusiness(id, ghlFields);
    }
    if (Object.keys(customProps).length > 0) {
      await ghlService.updateBusinessProperties(id, customProps);
    }
    businessesCache.invalidate();

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
    //    Fall back to business's membership_start_date custom field / today.
    const bizRecord = await ghlService.getBusinessById(id).catch(() => null);
    const fallbackDate = getBusinessProp(bizRecord, 'membership_start_date') ?? new Date().toISOString();

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
    const bizTierRaw = getBusinessProp(bizRecord, 'membership_tier');
    if (bizTierRaw) {
      const tierSlug = parseTierSlug(bizTierRaw);
      if (tierSlug) await ghlService.updateContactTags(contactId, [`${tierSlug} membership package`], 'add');
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
