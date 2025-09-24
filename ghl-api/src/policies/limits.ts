interface ContentPolicy {
  id: string;
  type: 'news' | 'event' | 'job';
  perMemberLimit: number;
  effectiveFrom: string;
  isActive: boolean;
}

export class EventsPolicy {
  private policies: Map<string, ContentPolicy> = new Map();
  private contentCounts: Map<string, Map<string, number>> = new Map();
  private nextId = 1;

  constructor() {
    this.initializeDefaultPolicies();
  }

  async canCreateContent(memberId: string, contentType: 'news' | 'event' | 'job'): Promise<boolean> {
    const policy = this.getActivePolicyForType(contentType);
    if (!policy) {
      return true; // No policy means no limit
    }

    const currentCount = this.getCurrentCount(memberId, contentType);
    return currentCount < policy.perMemberLimit;
  }

  async recordContentCreation(memberId: string, contentType: 'news' | 'event' | 'job'): Promise<void> {
    if (!this.contentCounts.has(memberId)) {
      this.contentCounts.set(memberId, new Map());
    }

    const memberCounts = this.contentCounts.get(memberId)!;
    const currentCount = memberCounts.get(contentType) || 0;
    memberCounts.set(contentType, currentCount + 1);
  }

  private getCurrentCount(memberId: string, contentType: 'news' | 'event' | 'job'): number {
    const memberCounts = this.contentCounts.get(memberId);
    if (!memberCounts) {
      return 0;
    }
    return memberCounts.get(contentType) || 0;
  }

  async getMemberLimits(memberId: string): Promise<{
    news: { current: number; limit: number; remaining: number };
    event: { current: number; limit: number; remaining: number };
    job: { current: number; limit: number; remaining: number };
  }> {
    const types: ('news' | 'event' | 'job')[] = ['news', 'event', 'job'];
    const result = {} as any;

    for (const type of types) {
      const policy = this.getActivePolicyForType(type);
      const current = this.getCurrentCount(memberId, type);
      const limit = policy?.perMemberLimit || Infinity;
      
      result[type] = {
        current,
        limit: limit === Infinity ? -1 : limit,
        remaining: limit === Infinity ? -1 : Math.max(0, limit - current)
      };
    }

    return result;
  }

  async createPolicy(policyData: {
    type: 'news' | 'event' | 'job';
    perMemberLimit: number;
    effectiveFrom?: string;
  }): Promise<ContentPolicy> {
    const id = `pol_${this.nextId++}`;
    const policy: ContentPolicy = {
      id,
      type: policyData.type,
      perMemberLimit: policyData.perMemberLimit,
      effectiveFrom: policyData.effectiveFrom || new Date().toISOString(),
      isActive: true
    };

    this.policies.set(id, policy);
    return policy;
  }

  async getActivePolicies(): Promise<ContentPolicy[]> {
    const now = new Date();
    return Array.from(this.policies.values())
      .filter(policy => policy.isActive && new Date(policy.effectiveFrom) <= now);
  }

  async resetCounts(contentType?: 'news' | 'event' | 'job'): Promise<void> {
    if (contentType) {
      // Reset counts for specific content type
      for (const memberCounts of this.contentCounts.values()) {
        memberCounts.set(contentType, 0);
      }
    } else {
      // Reset all counts
      this.contentCounts.clear();
    }
  }

  private getActivePolicyForType(contentType: 'news' | 'event' | 'job'): ContentPolicy | null {
    return Array.from(this.policies.values())
      .find(policy => 
        policy.type === contentType && 
        policy.isActive && 
        new Date(policy.effectiveFrom) <= new Date()
      ) || null;
  }

  private initializeDefaultPolicies(): void {
    // Default policies
    this.createPolicy({ type: 'news', perMemberLimit: 3 });
    this.createPolicy({ type: 'event', perMemberLimit: 2 });
    this.createPolicy({ type: 'job', perMemberLimit: 1 });
  }
}

// Export a singleton instance
export const contentLimitService = new EventsPolicy();
module.exports = { contentLimitService };
