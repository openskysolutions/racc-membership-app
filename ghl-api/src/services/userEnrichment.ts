/**
 * User enrichment utilities
 * Combines minimal database user data with profile data from GoHighLevel
 */

import { ghlService } from './gohighlevel';

/**
 * Extract membership tier from tags (lightweight)
 */
function getMembershipTierFromTags(tags: string[]): string {
  const tierTags = tags.filter(tag => 
    tag.toLowerCase().includes('elite') ||
    tag.toLowerCase().includes('enhanced') ||
    tag.toLowerCase().includes('standard')
  );

  if (tierTags.some(tag => tag.toLowerCase().includes('elite'))) return 'elite';
  if (tierTags.some(tag => tag.toLowerCase().includes('enhanced'))) return 'enhanced';
  if (tierTags.some(tag => tag.toLowerCase().includes('standard'))) return 'standard';
  
  return 'standard'; // Default
}

/**
 * Get membership tier stats (lightweight - only fetches tags)
 * Processes in batches to avoid rate limits
 */
export async function getMembershipTierStats(dbUsers: DatabaseUser[]): Promise<{
  elite: number;
  enhanced: number;
  standard: number;
}> {
  const stats = { elite: 0, enhanced: 0, standard: 0 };
  
  // Process in batches of 10 to avoid rate limits
  const BATCH_SIZE = 10;
  const allTiers: string[] = [];
  
  for (let i = 0; i < dbUsers.length; i += BATCH_SIZE) {
    const batch = dbUsers.slice(i, i + BATCH_SIZE);
    
    const tierPromises = batch.map(async (user) => {
      if (!user.ghlContactId) return 'standard';
      
      try {
        const tags = await ghlService.getContactTags(user.ghlContactId);
        return getMembershipTierFromTags(tags);
      } catch (error) {
        console.error(`Failed to get tier for user ${user.id}:`, error);
        return 'standard';
      }
    });

    const batchTiers = await Promise.all(tierPromises);
    allTiers.push(...batchTiers);
  }
  
  allTiers.forEach(tier => {
    if (tier === 'elite') stats.elite++;
    else if (tier === 'enhanced') stats.enhanced++;
    else stats.standard++;
  });
  
  return stats;
}

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
  avatarUrl?: string;
  
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
      // Helper to get custom field value
      const getCustomField = (fieldId: string, fieldName?: string) => {
        const field = contact.customFields?.find((f: any) => f.id === fieldId || f.key === fieldName);
        return field?.value || field?.field_value || '';
      };
      
      // Add profile data from GHL
      enrichedUser.firstName = contact.firstName || '';
      enrichedUser.lastName = contact.lastName || '';
      enrichedUser.name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || undefined;
      enrichedUser.businessName = contact.customFields?.['Business Name'] || contact.companyName || contact.businessName || '';
      enrichedUser.phone = contact.phone || '';
      enrichedUser.website = contact.website || '';
      enrichedUser.tags = contact.tags || [];
      enrichedUser.avatarUrl = getCustomField('331dKIcjgTa8z8a6mu37', 'avatar_url') || undefined;
      
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
