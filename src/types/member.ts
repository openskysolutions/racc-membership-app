export interface GamificationMeta {
  points: number;
  level: number;
}

export interface CustomField {
  id: string;
  value: string;
}

// ── Raw GHL API types (service layer only) ───────────────────────────────────

/** GHL v3 Business object returned by the Businesses API. */
export interface GHLBusiness {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  locationId: string;
  createdAt: string;
  updatedAt: string;
}

/** Input shape for createBusiness() — POST /businesses/ */
export interface GHLBusinessCreate {
  name: string;
  locationId: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  description?: string;
}

// ── Application-level types ───────────────────────────────────────────────────

/**
 * A chamber member — the GHL Business that holds the membership.
 * Fields are merged from GHL Business (native) + local BusinessProfile table (extended).
 */
export interface BusinessMember {
  // GHL Business native fields
  id: string;              // GHL Business ID (ghlBusinessId)
  businessName: string;    // business.name
  email?: string;
  phone?: string;
  website?: string;
  address1?: string;       // business.address
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  bio?: string;            // business.description + richer copy in BusinessProfile.bio

  // BusinessProfile table (extended fields)
  tagline?: string;
  avatar?: string;         // business logo / profile photo
  coverImage?: string;
  membershipTier?: 'elite' | 'enhanced' | 'basic' | 'standard';
  memberSince?: string;
  couponCodes?: string[];
  specialties?: string[];
  organizationType?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;    // business LinkedIn
  hideMembershipTier?: boolean;

  // Derived / joined
  categories?: string[];   // from MemberCategory table (keyed by ghlBusinessId)
}

/**
 * Personal profile fields for the "My Profile" page.
 * Only the fields that describe the person (not their business).
 */
export interface PersonalProfile {
  id: string;              // GHL Contact ID
  firstName?: string;
  lastName?: string;
  email: string;           // login identity — displayed but not editable
  phone?: string;
  title?: string;          // job title
  bio?: string;            // personal bio (GHL Contact custom field b3Yfp0NjO23zFXzwjswu)
  linkedinUrl?: string;    // personal LinkedIn (GHL Contact custom field b5LrmKi7eRpvD8r3FPmQ)
  avatar?: string;         // personal headshot (GHL Contact custom field 331dKIcjgTa8z8a6mu37)
}

/**
 * Auth session shape carried in JWT and authStore.
 */
export interface AuthenticatedUser {
  id: string;              // GHL Contact ID
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;            // 'admin' | 'board member' | 'moderator' | 'member'
  status: string;
  ghlBusinessId?: string | null;
  businessName?: string | null;
  isMainContact: boolean;
  isBusinessProfileEditor: boolean;
}

/**
 * Backward-compat alias — existing code that imports `Member` keeps working.
 * New code should use BusinessMember directly.
 */
export type Member = BusinessMember & {
  // Contact / personal fields still referenced by older components
  firstName?: string;
  lastName?: string;
  email: string;        // required in legacy components
  role?: string;
  status?: string;
  // Legacy fields
  tags?: string[];
  dateAdded?: string;
  locationId?: string;
  customFields?: CustomField[];
  coupon_codes?: string[];  // old spelling
  slug?: string;
  lastLogin?: string;
  groupId?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  gamificationMeta?: GamificationMeta;
  name?: string;
  fullName?: string;
  contactId?: string;
  companyName?: string;
  profilePhoto?: string;
};