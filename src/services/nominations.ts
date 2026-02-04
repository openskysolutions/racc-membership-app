import { api } from '@/services/apiClient';

export interface Nomination {
  id: string;
  title: string;
  description: string;
  category: 'member' | 'business' | 'volunteer' | 'leadership';
  nomineeInfo: {
    name: string;
    email?: string;
    organization?: string;
    phone?: string;
  };
  nominatorInfo: {
    name: string;
    email: string;
    organization?: string;
  };
  status: 'pending' | 'under-review' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  attachments?: string[];
}

export interface NominationSubmission {
  title: string;
  description: string;
  category: 'member' | 'business' | 'volunteer' | 'leadership';
  nomineeInfo: {
    name: string;
    email?: string;
    organization?: string;
    phone?: string;
  };
  nominatorInfo: {
    name: string;
    email: string;
    organization?: string;
  };
}

/**
 * Get all nominations (requires moderation access)
 */
export async function getNominations(): Promise<Nomination[]> {
  try {
    const response = await api.get('/nominations');
    
    if (!response || !response.ok) {
      if (response?.status === 403) {
        console.warn('Insufficient permissions - moderation access required');
        return []; // Return empty array instead of throwing
      }
      console.warn(`Failed to fetch nominations: ${response?.statusText || 'No response'}`);
      return []; // Return empty array instead of throwing
    }
    
    const data = await response.json();
    return data.nominations || [];
  } catch (error) {
    console.error('Error fetching nominations:', error);
    // Return empty array instead of throwing to prevent loading state issues
    return [];
  }
}

/**
 * Get a single nomination by ID (requires moderation access)
 */
export async function getNominationById(id: string): Promise<Nomination | null> {
  try {
    const response = await api.get(`/nominations/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      if (response.status === 403) {
        throw new Error('Insufficient permissions - moderation access required');
      }
      throw new Error(`Failed to fetch nomination: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching nomination:', error);
    throw error;
  }
}

/**
 * Submit a new nomination (public endpoint)
 */
export async function submitNomination(nomination: NominationSubmission): Promise<Nomination> {
  try {
    const response = await api.post('/nominations', nomination);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to submit nomination: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting nomination:', error);
    throw error;
  }
}

/**
 * Update nomination status (requires moderation access)
 */
export async function updateNominationStatus(
  id: string,
  status: 'pending' | 'under-review' | 'approved' | 'rejected',
  notes?: string
): Promise<Nomination> {
  try {
    const response = await api.patch(`/nominations/${id}/status`, {
      status,
      notes
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Insufficient permissions - moderation access required');
      }
      throw new Error(`Failed to update nomination status: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating nomination status:', error);
    throw error;
  }
}

/**
 * Delete a nomination (requires moderation access)
 */
export async function deleteNomination(id: string): Promise<void> {
  try {
    const response = await api.delete(`/nominations/${id}`);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Insufficient permissions - moderation access required');
      }
      throw new Error(`Failed to delete nomination: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting nomination:', error);
    throw error;
  }
}

/**
 * Get nomination statistics (requires moderation access)
 */
export async function getNominationStats(): Promise<{
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  byCategory: Record<string, number>;
}> {
  try {
    const response = await api.get('/nominations/stats');
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Insufficient permissions - moderation access required');
      }
      throw new Error(`Failed to fetch nomination statistics: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching nomination statistics:', error);
    throw error;
  }
}

/**
 * Get my submitted nominations (requires authentication)
 */
export async function getMyNominations(): Promise<Nomination[]> {
  try {
    const response = await api.get('/nominations/my');
    
    if (!response || !response.ok) {
      if (response?.status === 401) {
        console.warn('Authentication required for my nominations');
        return []; // Return empty array instead of throwing
      }
      console.warn(`Failed to fetch my nominations: ${response?.statusText || 'No response'}`);
      return []; // Return empty array instead of throwing
    }
    
    const data = await response.json();
    return data.nominations || [];
  } catch (error) {
    console.error('Error fetching my nominations:', error);
    // Return empty array instead of throwing to prevent loading state issues
    return [];
  }
}

/**
 * Check if current user has moderation access
 */
export async function hasNominationModerationAccess(): Promise<boolean> {
  try {
    const response = await api.get('/nominations/moderation-access');
    
    if (!response || !response.ok) {
      console.warn(`Failed to check moderation access: ${response?.statusText || 'No response'}`);
      return false; // Return false instead of throwing
    }
    
    const data = await response.json();
    return data.hasAccess || false;
  } catch (error) {
    console.error('Error checking nomination access:', error);
    // Return false instead of throwing to prevent loading state issues
    return false;
  }
}

/**
 * Validation helpers
 */
export const validateNomination = (nomination: Partial<NominationSubmission>): string[] => {
  const errors: string[] = [];
  
  if (!nomination.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (!nomination.description?.trim()) {
    errors.push('Description is required');
  }
  
  if (!nomination.category) {
    errors.push('Category is required');
  }
  
  if (!nomination.nomineeInfo?.name?.trim()) {
    errors.push('Nominee name is required');
  }
  
  if (!nomination.nominatorInfo?.name?.trim()) {
    errors.push('Nominator name is required');
  }
  
  if (!nomination.nominatorInfo?.email?.trim()) {
    errors.push('Nominator email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nomination.nominatorInfo.email)) {
    errors.push('Valid nominator email is required');
  }
  
  if (nomination.nomineeInfo?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nomination.nomineeInfo.email)) {
    errors.push('Valid nominee email is required if provided');
  }
  
  return errors;
};

/**
 * Format nomination category for display
 */
export const formatNominationCategory = (category: string): string => {
  switch (category) {
    case 'member':
      return 'Member of the Year';
    case 'business':
      return 'Business of the Year';
    case 'volunteer':
      return 'Volunteer of the Year';
    case 'leadership':
      return 'Leadership Award';
    default:
      return category;
  }
};

/**
 * Get category options for nomination forms
 */
export const getNominationCategories = () => [
  { value: 'member', label: 'Member of the Year' },
  { value: 'business', label: 'Business of the Year' },
  { value: 'volunteer', label: 'Volunteer of the Year' },
  { value: 'leadership', label: 'Leadership Award' }
];

// ========================================
// VOTING SYSTEM (Board Members Only)
// ========================================

export interface VotingNomination {
  id: number;
  type: string;
  category: string;
  name?: string;
  businessName: string;
  reason: string;
  status: string;
  createdAt: string;
  voteCount: number;
}

export interface VotingData {
  canVote: boolean;
  votingMonth?: string;
  targetMonth?: string;
  deadline?: string;
  businessOfMonth: VotingNomination[];
  customerServiceSuperstar: VotingNomination[];
  error?: string;
}

export interface VotingStatus {
  canVote: boolean;
  votingMonth?: string;
  targetMonth?: string;
  deadline?: string;
  error?: string;
  hasVoted: {
    business_of_month: boolean;
    customer_service_superstar: boolean;
  };
  votes: {
    business_of_month?: {
      nominationId: number;
      businessName: string;
      votedAt: string;
      targetMonth: string;
    } | null;
    customer_service_superstar?: {
      nominationId: number;
      name?: string;
      businessName: string;
      votedAt: string;
      targetMonth: string;
    } | null;
  };
}

/**
 * Get nominations available for voting (board members only)
 */
export async function getVotingNominations(): Promise<VotingData> {
  try {
    const response = await api.get('/nominations/voting');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        canVote: false,
        error: errorData.error || 'Failed to fetch voting nominations',
        businessOfMonth: [],
        customerServiceSuperstar: []
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching voting nominations:', error);
    return {
      canVote: false,
      error: 'Failed to connect to server',
      businessOfMonth: [],
      customerServiceSuperstar: []
    };
  }
}

/**
 * Get current user's voting status (board members only)
 */
export async function getVotingStatus(): Promise<VotingStatus> {
  try {
    const response = await api.get('/nominations/voting/status');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        canVote: false,
        error: errorData.error || 'Failed to fetch voting status',
        hasVoted: {
          business_of_month: false,
          customer_service_superstar: false
        },
        votes: {}
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching voting status:', error);
    return {
      canVote: false,
      error: 'Failed to connect to server',
      hasVoted: {
        business_of_month: false,
        customer_service_superstar: false
      },
      votes: {}
    };
  }
}

/**
 * Submit a vote for a nomination (board members only)
 */
export async function submitVote(nominationId: number, comment?: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await api.post(`/nominations/${nominationId}/vote`, { comment });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || 'Failed to submit vote'
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Vote submitted successfully'
    };
  } catch (error) {
    console.error('Error submitting vote:', error);
    return {
      success: false,
      error: 'Failed to connect to server'
    };
  }
}
