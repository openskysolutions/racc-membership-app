/**
 * User enrichment utilities
 * Combines minimal database user data with profile data from GoHighLevel
 */

import { ghlService } from './gohighlevel';

/**
 * Minimal user data from database (authentication only)
 */
interface DatabaseUser {
  id?: number;
  email: string;
  passwordHash?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  ghlContactId?: string | null;
  lastLoginAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Enriched user data with profile from GoHighLevel
 */
export interface EnrichedUser {
  // Database fields (authentication)
  id?: number;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  ghlContactId?: string | null;
  lastLoginAt?: string | Date | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Profile data from GoHighLevel
  firstName?: string;
  lastName?: string;
  name?: string;
  businessName?: string;
  phone?: string;
  website?: string;
  membershipTier?: string;
  tags?: string[];
  
  // Computed fields
  isActive?: boolean;
}

/**
 * Enrich user data with profile information from GoHighLevel
 * @param dbUser - Minimal user from database
 * @param skipGhlFetch - Skip fetching from GHL (for performance, when not needed)
 * @returns Enriched user with profile data
 */
export async function enrichUserWithGhlData(
  dbUser: DatabaseUser,
  skipGhlFetch: boolean = false
): Promise<EnrichedUser> {
  // Start with database data (no password hash)
  const enrichedUser: EnrichedUser = {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    status: dbUser.status,
    emailVerified: dbUser.emailVerified,
    ghlContactId: dbUser.ghlContactId,
    lastLoginAt: dbUser.lastLoginAt,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt
  };

  // If no GHL contact ID or skip requested, return database data only
  if (!dbUser.ghlContactId || skipGhlFetch) {
    return enrichedUser;
  }

  try {
    // Fetch profile data from GoHighLevel
    const contact = await ghlService.getContact(dbUser.ghlContactId);
    
    if (contact) {
      // Add profile data from GHL
      enrichedUser.firstName = contact.firstName || '';
      enrichedUser.lastName = contact.lastName || '';
      enrichedUser.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || undefined;
      enrichedUser.businessName = contact.customFields?.['Business Name'] || contact.companyName || contact.businessName || '';
      enrichedUser.phone = contact.phone || '';
      enrichedUser.website = contact.website || '';
      enrichedUser.tags = contact.tags || [];
      
      // Determine membership tier from tags or custom fields
      enrichedUser.membershipTier = getMembershipTierFromContact(contact);
      
      // Check if user has active tag
      enrichedUser.isActive = contact.tags?.some((tag: string) => 
        tag.toLowerCase() === 'active'
      ) || false;
    }
  } catch (error) {
    console.error(`Failed to enrich user ${dbUser.id} with GHL data:`, error);
    // Return database data even if GHL fetch fails
  }

  return enrichedUser;
}

/**
 * Enrich multiple users with GHL data (for admin lists)
 * @param dbUsers - Array of minimal users from database
 * @param fetchGhlData - Whether to fetch profile data from GHL
 * @returns Array of enriched users
 */
export async function enrichUsersWithGhlData(
  dbUsers: DatabaseUser[],
  fetchGhlData: boolean = true
): Promise<EnrichedUser[]> {
  if (!fetchGhlData) {
    // Return database data only (fast path for large lists)
    return Promise.all(dbUsers.map(user => enrichUserWithGhlData(user, true)));
  }

  // Fetch GHL data for all users in parallel
  const enrichedPromises = dbUsers.map(user => 
    enrichUserWithGhlData(user, false)
  );

  return Promise.all(enrichedPromises);
}

/**
 * Extract membership tier from GoHighLevel contact
 * @param contact - GoHighLevel contact object
 * @returns Membership tier string
 */
function getMembershipTierFromContact(contact: any): string {
  // Check custom fields first
  if (contact.customFields?.['Membership Tier']) {
    return contact.customFields['Membership Tier'];
  }

  // Check tags for tier indicators
  if (contact.tags) {
    const tags = contact.tags.map((t: string) => t.toLowerCase());
    
    if (tags.some((t: string) => t.includes('elite') || t.includes('platinum'))) {
      return 'elite';
    }
    if (tags.some((t: string) => t.includes('enhanced') || t.includes('gold'))) {
      return 'enhanced';
    }
    if (tags.some((t: string) => t.includes('basic') || t.includes('bronze'))) {
      return 'basic';
    }
  }

  return 'standard';
}

/**
 * Create a safe user object for API responses (no password hash)
 * @param user - Enriched user object
 * @returns User object safe for API responses
 */
export function createSafeUserResponse(user: EnrichedUser): Omit<EnrichedUser, 'passwordHash'> {
  const { ...safeUser } = user;
  return safeUser;
}
