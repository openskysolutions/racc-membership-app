/**
 * Moderation service for handling content review and approval workflows
 */

import { apiFetch } from './apiClient';

// Types
export interface ModerationAction {
  id: string;
  contentType: 'nomination' | 'event' | 'post';
  contentId: string;
  action: 'approve' | 'reject' | 'hide' | 'restore';
  moderatorId: string;
  reason?: string;
  notes?: string;
  timestamp: string;
}

export interface ModerationQueue {
  nominations: any[];
  events: any[];
  posts: any[];
  total: number;
}

/**
 * Approve a nomination
 */
export async function approveNomination(nominationId: string, reason?: string): Promise<{
  message: string;
  nomination: any;
}> {
  const response = await apiFetch(`/nominations/${nominationId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to approve nomination: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Reject a nomination
 */
export async function rejectNomination(nominationId: string, reason?: string): Promise<{
  message: string;
  nomination: any;
}> {
  const response = await apiFetch(`/nominations/${nominationId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to reject nomination: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get moderation queue (pending content)
 */
/**
 * Check if current user has moderation access
 */
export async function checkModerationAccess(): Promise<{ hasAccess: boolean }> {
  const response = await apiFetch('/nominations/moderation-access');
  
  if (!response.ok) {
    throw new Error(`Failed to check moderation access: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Bulk approve multiple nominations
 */
export async function bulkApproveNominations(nominationIds: string[], reason?: string): Promise<{
  message: string;
  results: Array<{ id: string; status: 'success' | 'error'; nomination?: any; error?: string }>;
  successful: number;
  failed: number;
}> {
  const response = await apiFetch('/nominations/bulk-approve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nominationIds, reason }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to bulk approve nominations: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Bulk reject multiple nominations
 */
export async function bulkRejectNominations(nominationIds: string[], reason?: string): Promise<{
  message: string;
  results: Array<{ id: string; status: 'success' | 'error'; nomination?: any; error?: string }>;
  successful: number;
  failed: number;
}> {
  const response = await apiFetch('/nominations/bulk-reject', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nominationIds, reason }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to bulk reject nominations: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get nomination statistics for status tracking
 */
export async function getNominationStats(): Promise<{
  total?: number;
  pending?: number;
  underReview?: number;
  approved?: number;
  rejected?: number;
  byCategory?: {
    member: number;
    business: number;
    volunteer: number;
    leadership: number;
  };
  myNominations?: {
    total: number;
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
  };
}> {
  const response = await apiFetch('/nominations/stats');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch nomination statistics: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get moderation log (history of actions)
 */
export async function getModerationLog(): Promise<ModerationAction[]> {
  const response = await apiFetch('/moderation/log');
  
  if (!response.ok) {
    throw new Error(`Failed to load moderation log: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.actions || [];
}

/**
 * Report content for moderation
 */
export async function reportContent(
  contentType: 'post' | 'event' | 'nomination',
  contentId: string,
  reason: string
): Promise<{ reportId: string }> {
  const response = await apiFetch(`/moderation/${contentType}s/${contentId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to report content');
  }
  
  return response.json();
}