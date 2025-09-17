// Content Limit Policy - enforces per-member content creation limits

/**
 * Service for enforcing content creation limits per member
 */
class ContentLimitService {
  constructor() {
    this.policies = new Map(); // Active policies
    this.contentCounts = new Map(); // memberId -> contentType -> count

  constructor() {
    // Initialize default policies
    this.initializeDefaultPolicies();
  }

  /**
   * Check if member can create content of specified type
   * @param memberId - Member ID
   * @param contentType - Type of content ('news', 'event', 'job')
   * @returns True if creation allowed, false if limit exceeded
   */
  async canCreateContent(memberId, contentType: 'news' | 'event' | 'job'),  {
    const policy = this.getActivePolicyForType(contentType);
    if (!policy) {
      return true; // No policy = no limit
    }

    const currentCount = this.getCurrentCount(memberId, contentType);
    return currentCount < policy.perMemberLimit;
  }

  /**
   * Record content creation for a member
   * @param memberId - Member ID
   * @param contentType - Type of content created
   */
  async recordContentCreation(memberId, contentType: 'news' | 'event' | 'job'),  {
    if (!this.contentCounts.has(memberId)) {
      this.contentCounts.set(memberId, new Map());
    }

    const memberCounts = this.contentCounts.get(memberId)!;
    const currentCount = memberCounts.get(contentType) || 0;
    memberCounts.set(contentType, currentCount + 1);
  }

  /**
   * Get current content count for member by type
   * @param memberId - Member ID
   * @param contentType - Type of content
   * @returns Current count
   */
  getCurrentCount(memberId, contentType) {
    const memberCounts = this.contentCounts.get(memberId);
    return memberCounts?.get(contentType) || 0;
  }

  /**
   * Get remaining allowance for member by content type
   * @param memberId - Member ID
   * @param contentType - Type of content
   * @returns Number of items still allowed to create
   */
  async getRemainingAllowance(
    memberId
    contentType: 'news' | 'event' | 'job'
  ),  {
    const policy = this.getActivePolicyForType(contentType);
    if (!policy) {
      return Number.MAX_SAFE_INTEGER; // No limit
    }

    const currentCount = this.getCurrentCount(memberId, contentType);
    return Math.max(0, policy.perMemberLimit - currentCount);
  }

  /**
   * Get all content limits for a member
   * @param memberId - Member ID
   * @returns Object with limits by content type
   */
  async getMemberLimits(memberId)<{
    news: { current: number; limit: number; remaining: number };
    event: { current: number; limit: number; remaining: number };
    job: { current: number; limit: number; remaining: number };
  }> {
    const types: ('news' | 'event' | 'job')[] = ['news', 'event', 'job'];
    const limits = {} as any;

    for (const type of types) {
      const policy = this.getActivePolicyForType(type);
      const current = this.getCurrentCount(memberId, type);
      const limit = policy?.perMemberLimit || Number.MAX_SAFE_INTEGER;
      const remaining = Math.max(0, limit - current);

      limits[type] = { current, limit, remaining };
    }

    return limits;
  }

  /**
   * Create or update a content limit policy
   * @param policyData - Policy configuration
   * @returns Created policy
   */
  async createPolicy(policyData: {
    type: 'news' | 'event' | 'job';
    perMemberLimit: number;
    effectiveFrom?, ;
  }),  {
    const id = `policy_${Date.now()}_${policyData.type}`;
    const policy = {
      id,
      type: policyData.type,
      perMemberLimit: policyData.perMemberLimit,
      effectiveFrom: policyData.effectiveFrom || new Date().toISOString()
    };

    this.policies.set(id, policy);
    return policy;
  }

  /**
   * Get active policies
   * @returns Array of active policies
   */
  async getActivePolicies(),  {
    const now = new Date();
    return Array.from(this.policies.values())
      .filter(policy => new Date(policy.effectiveFrom) <= now);
  }

  /**
   * Reset content counts for a specific time period (e.g., monthly reset)
   * @param contentType - Optional content type filter
   */
  async resetCounts(contentType?: 'news' | 'event' | 'job'),  {
    if (contentType) {
      // Reset specific content type for all members
      this.contentCounts.forEach(memberCounts => {
        memberCounts.set(contentType, 0);
      });
    } else {
      // Reset all counts
      this.contentCounts.clear();
    }
  }

  /**
   * Get content creation statistics
   * @returns Statistics about content creation
   */
  async getContentStats()<{
    totalMembers: number;
    byContentType<string, { totalCreated: number; avgPerMember: number; membersAtLimit: number }>;
  }> {
    const totalMembers = this.contentCounts.size;
    const byContentType = {} as any;

    const contentTypes = ['news', 'event', 'job'];
    
    for (const type of contentTypes) {
      let totalCreated = 0;
      let membersAtLimit = 0;
      const policy = this.getActivePolicyForType(type);

      this.contentCounts.forEach(memberCounts => {
        const count = memberCounts.get(type) || 0;
        totalCreated += count;
        
        if (policy && count >= policy.perMemberLimit) {
          membersAtLimit++;
        }
      });

      byContentType[type] = {
        totalCreated,
        avgPerMember: totalMembers > 0 ? totalCreated / totalMembers : 0,
        membersAtLimit
      };
    }

    return { totalMembers, byContentType };
  }

  // Private helper methods

  getActivePolicyForType(contentType) {
    const now = new Date();
    const policies = Array.from(this.policies.values())
      .filter(policy => 
        policy.type === contentType && 
        new Date(policy.effectiveFrom) <= now
      )
      .sort((a, b) => 
        new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
      );

    return policies[0] || null; // Return most recent policy
  }

  initializeDefaultPolicies() {
    // Default policies - can be adjusted per chamber requirements
    const defaultPolicies = [
      { type: 'news' as const, perMemberLimit: 2 }, // 2 news articles per period
      { type: 'event' as const, perMemberLimit: 3 }, // 3 events per period
      { type: 'job' as const, perMemberLimit: 5 }  // 5 job postings per period
    ];

    defaultPolicies.forEach(policyData => {
      this.createPolicy(policyData);
    });
  }
}

// Singleton instance
const contentLimitService = new ContentLimitService();

module.exports = { contentLimitService };
