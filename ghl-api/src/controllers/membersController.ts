/**
 * Members Controller for RACC Membership Portal
 * Handles member directory, profiles, and search functionality
 */

import { Request, Response } from 'express';
import { ghlService } from '@/services/gohighlevel';

interface CustomField {
  id: string;
  value: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Member {
  // Core Member Fields
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  companyName?: string;
  phone?: string;
  website?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  tagline?: string;
  couponCodes?: string[];
  
  // GoHighLevel Specific Fields
  tags: string[];
  dateAdded?: string;
  locationId?: string;
  
  // Custom Fields Data
  customFields?: CustomField[];
  memberSince?: string;
  specialties?: string[];
  membershipTier?: string;
  
  // Address Information
  address?: Address;
  
  // System Fields
  role: string;
  status: string;
  
  // Computed Fields
  name?: string;
}

class MembersController {
  private membersCache: any = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes instead of 5 for fresher data
  private fetchPromise: Promise<any> | null = null; // For request deduplication
  
  // Cache for individual member details
  private memberDetailsCache: Map<string, { member: any; timestamp: number }> = new Map();
  private readonly MEMBER_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for individual members

  constructor() {
    // Members are now fetched from GoHighLevel instead of mock data
  }

  /**
   * Get list of active members from GoHighLevel with server-side pagination
   */
  async getMembers(req: Request, res: Response) {
    try {
      const { search = '', role = '', limit = 20, offset = 0 } = req.query;
      const pageLimit = Math.min(parseInt(limit as string) || 20, 100); // Cap at 100
      const pageOffset = parseInt(offset as string) || 0;
      
      // Calculate how many contacts we need to fetch to account for filtering
      // We'll fetch more than needed and then apply client-side filters
      const fetchLimit = Math.max(pageLimit * 3, 100); // Fetch 3x more to account for filtering
      
      // Check for force refresh parameter
      const forceRefresh = req.query.refresh === 'true';
      
      // Check if we have cached data that's still valid
      const now = Date.now();
      const isCacheValid = !forceRefresh && this.membersCache && (now - this.cacheTimestamp) < this.CACHE_DURATION;
      
      let allContacts;
      if (isCacheValid) {
        console.log('📋 Using cached member data');
        allContacts = this.membersCache;
      } else {
        if (forceRefresh) {
          console.log('🔄 Force refresh requested - fetching fresh data...');
        }
        // Check if there's already a fetch in progress
        if (this.fetchPromise) {
          console.log('⏳ Waiting for existing fetch to complete...');
          allContacts = await this.fetchPromise;
        } else {
          console.log('🔄 Fetching fresh member data from GoHighLevel...');
          // Create the fetch promise for deduplication
          this.fetchPromise = this.fetchContactsWithTimeout();
          
          try {
            allContacts = await this.fetchPromise;
            // Update cache
            this.membersCache = allContacts;
            this.cacheTimestamp = now;
            console.log(`✅ Cached ${allContacts.length} contacts`);
          } catch (error) {
            console.error('❌ Failed to fetch contacts:', error);
            // Return cached data if available, even if stale
            if (this.membersCache) {
              console.log('⚠️ Using stale cached data due to fetch error');
              allContacts = this.membersCache;
            } else {
              throw error;
            }
          } finally {
            // Clear the fetch promise
            this.fetchPromise = null;
          }
        }
      }
      
      // Transform GoHighLevel contacts to our Member format
      let transformedMembers = allContacts.map(contact => this.transformContactToMember(contact));
      
      // Cache individual member details while we have them
      const cacheTimestamp = Date.now();
      transformedMembers.forEach(member => {
        const memberWithComputedFields = {
          ...member,
          name: `${member.firstName} ${member.lastName}`.trim(),
          membershipTier: this.getMembershipTier(member)
        };
        
        this.memberDetailsCache.set(member.id, {
          member: memberWithComputedFields,
          timestamp: cacheTimestamp
        });
      });
      
      console.log(`💾 Cached ${transformedMembers.length} individual member details`);
      
      // Apply search filter to the full dataset
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        transformedMembers = transformedMembers.filter(member => 
          member.firstName?.toLowerCase().includes(searchLower) ||
          member.lastName?.toLowerCase().includes(searchLower) ||
          member.businessName?.toLowerCase().includes(searchLower) ||
          member.email?.toLowerCase().includes(searchLower) ||
          member.specialties?.some((specialty: string) => 
            specialty.toLowerCase().includes(searchLower)
          )
        );
      }
      
      // Filter by role (based on tags) - only if role is provided
      if (role && typeof role === 'string') {
        transformedMembers = transformedMembers.filter(member => member.role === role);
      }
      
      // Apply pagination to the filtered results
      const totalMembers = transformedMembers.length;
      const paginatedMembers = transformedMembers.slice(pageOffset, pageOffset + pageLimit);
      
      // Return only business name and ID for each member
      const simplifiedMembers = paginatedMembers.map(member => ({
        id: member.id,
        businessName: member.businessName || member.companyName || `${member.firstName} ${member.lastName}`.trim() || 'Unknown Business',
        avatar: member.avatar || '/profile-placeholder.png',
      }));
      
      res.json({
        members: simplifiedMembers,
        total: totalMembers,
        limit: pageLimit,
        offset: pageOffset,
        hasMore: pageOffset + pageLimit < totalMembers
      });
    } catch (error) {
      console.error('Error fetching members from GoHighLevel:', error);
      res.status(500).json({ error: 'Failed to fetch members', details: error.message });
    }
  }

  /**
   * Fetch contacts with timeout protection
   */
  private async fetchContactsWithTimeout(): Promise<any[]> {
    const fetchPromise = ghlService.getContactsWithMembershipTags();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
    );
    
    return Promise.race([fetchPromise, timeoutPromise]);
  }

  /**
   * Transform GoHighLevel contact to Member format
   */
  private transformContactToMember(contact: any): Member {
    // Debug: Log custom fields structure
    console.log(`🔍 Contact custom fields:`, JSON.stringify(contact.customFields, null, 2));
    
    // GoHighLevel custom field ID mappings
    const CUSTOM_FIELD_IDS = {
      bio: 'b3Yfp0NjO23zFXzwjswu',
      avatar_url: '331dKIcjgTa8z8a6mu37',
      cover_image: '3tSDY90RIMPP4W7uQxF9',
      memberSince: 'Dxt6gzc4osQhaCBPhslY',
      membershipType: 'inm2jc52WNhxX8H2FHHm',
      organizationType: 'kPoBTUVldHyg3WbywLJ9',
      tagline: '3PZ7J4UcjLwnzWudAZHi',
      couponCodes: '9rtkCBAUmFZdHs9ALwQl'
    };
    
    // Extract custom field values
    const getCustomField = (fieldName: string) => {
      const fieldId = CUSTOM_FIELD_IDS[fieldName as keyof typeof CUSTOM_FIELD_IDS] || fieldName;
      // Try to find by mapped ID first, then by key, then by original fieldName as id
      const field = contact.customFields?.find(f => f.id === fieldId || f.key === fieldName || f.id === fieldName);
      const value = field?.value || field?.field_value || '';
      console.log(`🔍 getCustomField('${fieldName}') [mapped to ${fieldId}]:`, { field, value });
      return value;
    };

    // Determine role from tags
    const tags = contact.tags || [];
    let role = 'member'; // default
    if (tags.includes('admin')) role = 'admin';
    else if (tags.includes('moderator')) role = 'moderator';

    // Parse specialties from custom field
    const specialtiesStr = getCustomField('specialties');
    const specialties = specialtiesStr ? specialtiesStr.split(',').map(s => s.trim()).filter(s => s) : [];

    // Parse coupon codes from custom field (direct lookup by ID)
    const couponCodesField = contact.customFields?.find(f => f.id === '9rtkCBAUmFZdHs9ALwQl');
    const couponCodesStr = couponCodesField?.value || '';
    let couponCodes: string[] = [];
    
    if (couponCodesStr) {
      try {
        // First try to parse as JSON array
        const parsed = JSON.parse(couponCodesStr);
        if (Array.isArray(parsed)) {
          couponCodes = parsed;
        }
      } catch (error) {
        // If JSON parsing fails, treat as comma-separated string
        couponCodes = couponCodesStr.split(',').map(s => s.trim()).filter(s => s);
      }
    }

    // Get avatar URL from custom fields, fall back to placeholder
    // Use the actual custom field ID for avatar_url: 331dKIcjgTa8z8a6mu37
    const avatarUrl = getCustomField('331dKIcjgTa8z8a6mu37') || getCustomField('avatar_url') || getCustomField('profile_photo') || '/profile-placeholder.png';

    // Get membership tier from tags or custom fields
    const membershipTier = this.getMembershipTier(contact);

    return {
      // Core Member Fields
      id: contact.id,
      email: contact.email || '',
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      businessName: contact.businessName || contact.companyName || '',
      companyName: contact.companyName || '',
      phone: contact.phone || '',
      website: contact.website || '',
      avatar: avatarUrl,
      bio: getCustomField('bio') || '', // Bio is stored as a custom field
      coverImage: getCustomField('cover_image') || '', // Cover image is stored as a custom field
      tagline: getCustomField('tagline') || '', // Tagline is stored as a custom field
      couponCodes: couponCodes, // Coupon codes are stored as a JSON array in custom field
      
      // GoHighLevel Specific Fields
      tags: tags,
      dateAdded: contact.dateAdded || contact.createdAt,
      locationId: contact.locationId,
      
      // Custom Fields Data (include raw custom fields for frontend access)
      customFields: contact.customFields || [],
      memberSince: getCustomField('memberSince') || contact.dateAdded?.substring(0, 10) || new Date().toISOString().substring(0, 10),
      specialties,
      membershipTier,
      
      // Address Information
      address: {
        street: contact.address1 || '',
        city: contact.city || '',
        state: contact.state || '',
        zipCode: contact.postalCode || ''
      },
      
      // System Fields
      role,
      status: 'active', // All fetched contacts have 'active' tag
      
      // Computed Fields
      name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
    };
  }

  /**
   * Get member by ID from GoHighLevel
   */
  async getMemberById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check cache first
      const cachedMember = this.memberDetailsCache.get(id);
      const now = Date.now();
      
      if (cachedMember && (now - cachedMember.timestamp) < this.MEMBER_CACHE_DURATION) {
        console.log(`💾 Serving member ${id} from cache`);
        return res.json(cachedMember.member);
      }
      
      // Try to get the contact directly by ID
      const contact = await ghlService.getContact(id);
      
      if (!contact) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      // Check if contact has active tag
      const hasActiveTag = contact.tags?.includes('active');
      if (!hasActiveTag) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      // Transform to member format
      const member = this.transformContactToMember(contact);
      
      // Add computed fields for API compatibility
      const memberWithComputedFields = {
        ...member,
        name: `${member.firstName} ${member.lastName}`.trim(),
        membershipTier: this.getMembershipTier(member)
      };
      
      // Cache the result
      this.memberDetailsCache.set(id, {
        member: memberWithComputedFields,
        timestamp: now
      });
      
      res.json(memberWithComputedFields);
    } catch (error) {
      console.error('Error fetching member by ID:', error);
      res.status(500).json({ error: 'Failed to fetch member', details: error.message });
    }
  }

  /**
   * Update member information
   */
  async updateMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Validate that the user can update this member
      // Either it's their own profile (compare GHL contact IDs) or they're an admin
      const userGhlContactId = (req as any).user?.ghlContactId;
      const userRole = (req as any).user?.role;
      
      if (userGhlContactId !== id && userRole !== 'admin') {
        return res.status(403).json({ error: 'You can only update your own profile or admin access required' });
      }
      
      // Get current member to verify it exists and is active
      const contact = await ghlService.getContact(id);
      if (!contact || !contact.tags?.includes('active')) {
        return res.status(404).json({ error: 'Member not found' });
      }
      
      // Prepare update data for GoHighLevel
      const ghlUpdateData = {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone,
        website: updateData.website,
        companyName: updateData.businessName, // Map businessName to GoHighLevel's companyName field
        // Map bio, tagline, coupon codes and cover image to custom fields
        bio: updateData.bio || '',
        tagline: updateData.tagline || '',
        couponCodes: updateData.coupon_codes || updateData.couponCodes || '[]', // Handle both naming conventions
        coverImage: updateData.coverImage || '',
        // Map address fields to correct GoHighLevel fields
        address1: updateData.address?.street || '',
        city: updateData.address?.city || '',
        state: updateData.address?.state || '',
        postalCode: updateData.address?.zipCode || '',
        email: updateData.email
      };
      
      // Update contact in GoHighLevel
      await ghlService.updateContact(id, ghlUpdateData);
      
      // Clear cache for this member
      this.memberDetailsCache.delete(id);
      
      // Add a small delay to allow GoHighLevel to propagate changes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch updated member data
      console.log(`🔄 Fetching updated contact data for ${id}`);
      const updatedContact = await ghlService.getContact(id);
      console.log(`🔄 Updated contact data:`, JSON.stringify(updatedContact, null, 2));
      
      const updatedMember = this.transformContactToMember(updatedContact);
      console.log(`🔄 Transformed member data:`, updatedMember);
      
      const memberWithComputedFields = {
        ...updatedMember,
        name: `${updatedMember.firstName} ${updatedMember.lastName}`.trim(),
        membershipTier: this.getMembershipTier(updatedMember)
      };
      
      // Update cache with new data
      this.memberDetailsCache.set(id, {
        member: memberWithComputedFields,
        timestamp: Date.now()
      });
      
      res.json(memberWithComputedFields);
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(500).json({ error: 'Failed to update member', details: error.message });
    }
  }

  /**
   * Update contact avatar URL in custom field
   */
  async updateContactAvatar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { avatarUrl } = req.body;
      
      console.log(`Updating avatar for contact ${id} with URL: ${avatarUrl}`);
      
      // Validate that the user can update this contact's avatar
      const userGhlContactId = (req as any).user?.ghlContactId;
      const userRole = (req as any).user?.role;
      
      if (userGhlContactId !== id && userRole !== 'admin') {
        return res.status(403).json({ error: 'You can only update your own avatar or admin access required' });
      }
      
      if (!avatarUrl) {
        return res.status(400).json({ error: 'Avatar URL is required' });
      }
      
      // Get current contact to verify it exists
      const contact = await ghlService.getContact(id);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      
      // Update contact with avatar URL in custom fields
      const updateData = {
        customFields: {
          ...contact.customFields,
          avatar_url: avatarUrl,
          profile_photo: avatarUrl
        }
      };
      
      // Update contact in GoHighLevel
      await ghlService.updateContact(id, updateData);
      
      // Clear cache for this member AND the main members cache to show updated avatar immediately
      this.memberDetailsCache.delete(id);
      this.membersCache = null; // Clear main cache so avatars refresh immediately
      this.cacheTimestamp = 0;
      
      console.log(`Avatar URL updated successfully for contact ${id}`);
      
      res.json({ 
        success: true, 
        message: 'Avatar URL updated successfully',
        avatarUrl: avatarUrl
      });
    } catch (error) {
      console.error('Error updating contact avatar:', error);
      res.status(500).json({ error: 'Failed to update avatar', details: error.message });
    }
  }

  /**
   * Update contact cover image URL in custom field
   */
  async updateContactCoverImage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { coverImageUrl } = req.body;
      
      console.log(`Updating cover image for contact ${id} with URL: ${coverImageUrl}`);
      
      // Validate that the user can update this contact's cover image
      const userGhlContactId = (req as any).user?.ghlContactId;
      const userRole = (req as any).user?.role;
      
      if (userGhlContactId !== id && userRole !== 'admin') {
        return res.status(403).json({ error: 'You can only update your own cover image or admin access required' });
      }
      
      if (!coverImageUrl) {
        return res.status(400).json({ error: 'Cover image URL is required' });
      }
      
      // Get current contact to verify it exists
      const contact = await ghlService.getContact(id);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      
      // Update contact with cover image URL in custom fields
      await ghlService.updateContact(id, {
        coverImage: coverImageUrl
      });
      
      // Clear cache for this member
      this.memberDetailsCache.delete(id);
      
      res.json({ 
        success: true, 
        message: 'Cover image URL updated successfully',
        coverImageUrl: coverImageUrl
      });
    } catch (error) {
      console.error('Error updating contact cover image:', error);
      res.status(500).json({ error: 'Failed to update cover image', details: error.message });
    }
  }

  /**
   * Get member by email from GoHighLevel
   */
  async getMemberByEmail(req: Request, res: Response) {
    try {
      const { email } = req.params;
      
      // Use GoHighLevel's direct email search
      const contact = await ghlService.findContactByEmail(email);
      
      if (!contact || !contact.tags?.includes('active')) {
        return res.status(404).json({ error: 'Active member not found' });
      }
      
      // Transform to member format
      const member = this.transformContactToMember(contact);
      
      res.json(member);
    } catch (error) {
      console.error('Error fetching member by email:', error);
      res.status(500).json({ error: 'Failed to fetch member', details: error.message });
    }
  }

  /**
   * Get member statistics (admin only)
   */
  async getMemberStats(req: Request, res: Response) {
    try {
      // Fetch all active members for statistics
      const contacts = await ghlService.getContactsWithTags(['active'], 100);
      const activeMembers = contacts.map(contact => this.transformContactToMember(contact));
      
      const roleStats = activeMembers.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1;
        return acc;
      }, {});
      
      const currentYear = new Date().getFullYear();
      const newThisYear = activeMembers.filter(m => 
        new Date(m.memberSince).getFullYear() === currentYear
      ).length;
      
      res.json({
        totalActiveMembers: activeMembers.length,
        roleDistribution: roleStats,
        newMembersThisYear: newThisYear,
        membersBySpecialty: this.getMembersBySpecialty(activeMembers)
      });
    } catch (error) {
      console.error('Error fetching member statistics:', error);
      res.status(500).json({ error: 'Failed to fetch member statistics', details: error.message });
    }
  }

  /**
   * Warm the members cache (useful for scheduled jobs)
   */
  async warmCache(req: Request, res: Response) {
    try {
      console.log('🔥 Warming members cache...');
      const startTime = Date.now();
      
      // Force refresh the cache
      this.membersCache = null;
      this.cacheTimestamp = 0;
      
      // Fetch fresh data
      const contacts = await this.fetchContactsWithTimeout();
      this.membersCache = contacts;
      this.cacheTimestamp = Date.now();
      
      const duration = Date.now() - startTime;
      
      res.json({
        message: 'Cache warmed successfully',
        contactCount: contacts.length,
        duration: `${duration}ms`,
        cacheValidUntil: new Date(this.cacheTimestamp + this.CACHE_DURATION).toISOString()
      });
    } catch (error) {
      console.error('Failed to warm cache:', error);
      res.status(500).json({ error: 'Failed to warm cache', details: error.message });
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus(req: Request, res: Response) {
    const now = Date.now();
    const isCacheValid = this.membersCache && (now - this.cacheTimestamp) < this.CACHE_DURATION;
    const cacheAge = this.cacheTimestamp ? now - this.cacheTimestamp : null;
    
    res.json({
      hasCachedData: !!this.membersCache,
      isCacheValid,
      cacheAge: cacheAge ? `${Math.round(cacheAge / 1000)}s` : null,
      cachedContactCount: this.membersCache ? this.membersCache.length : 0,
      cacheValidUntil: this.cacheTimestamp ? 
        new Date(this.cacheTimestamp + this.CACHE_DURATION).toISOString() : null
    });
  }

  /**
   * Clear all caches (useful for immediate avatar updates)
   */
  async clearCache(req: Request, res: Response) {
    console.log('🗑️ Clearing all member caches...');
    
    // Clear main members cache
    this.membersCache = null;
    this.cacheTimestamp = 0;
    
    // Clear individual member details cache
    this.memberDetailsCache.clear();
    
    res.json({
      message: 'All member caches cleared successfully',
      timestamp: new Date().toISOString()
    });
  }

    /**
   * Determine membership tier from member/contact data using GoHighLevel tags
   */
  private getMembershipTier(memberOrContact: any): string {
    const tags = memberOrContact.tags || [];
    
    // Check for GoHighLevel membership package tags
    if (tags.includes('elite membership package')) return 'elite';
    if (tags.includes('enhanced membership package')) return 'enhanced';
    if (tags.includes('basic membership package')) return 'basic';
    
    // Fallback for admin role
    const role = memberOrContact.role || (tags.includes('admin') ? 'admin' : 'member');
    if (role === 'admin') return 'elite';
    
    // Default fallback
    return 'basic';
  }

  /**
   * Helper method to group members by specialty
   */
  private getMembersBySpecialty(members: Member[]) {
    const specialtyCount = {};
    
    members.forEach(member => {
      if (member.specialties && Array.isArray(member.specialties)) {
        member.specialties.forEach(specialty => {
          specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
        });
      }
    });
    
    return Object.entries(specialtyCount)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10); // Top 10 specialties
  }
}

export default new MembersController();
