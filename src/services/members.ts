import type { Member } from '@/types/member';
import { api } from '@/services/apiClient';

/**
 * Fetch paginated active members from RACC backend
 */
export async function getMembersList(
  page = 1,
  pageLimit = 20
): Promise<Member[]> {
  try {
    const response = await api.get(`/members?limit=${pageLimit}&offset=${(page - 1) * pageLimit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch members: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.members || [];
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
}

/**
 * Get a single member by ID
 */
export async function getMemberById(id: string): Promise<Member | null> {
  try {
    const response = await api.get(`/members/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch member: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching member:', error);
    throw error;
  }
}

/**
 * Search for a member by email
 */
export async function getMemberByEmail(email: string): Promise<Member | null> {
  try {
    const response = await api.get(`/members/search/${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to search member: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching member:', error);
    throw error;
  }
}

/**
 * Update member profile
 */
export async function updateMemberProfile(id: string, updates: Partial<Member>): Promise<Member> {
  try {
    const response = await api.patch(`/members/${id}`, updates);
    
    if (!response.ok) {
      throw new Error(`Failed to update member: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
}

/**
 * Get member statistics
 */
export async function getMemberStats(): Promise<{
  totalMembers: number;
  activeMembers: number;
  newThisMonth: number;
  byTier: Record<string, number>;
}> {
  try {
    const response = await api.get('/members/stats');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch member stats: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching member stats:', error);
    throw error;
  }
}
