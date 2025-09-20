import { apiFetch } from './apiClient';
import type { Event } from './events';

interface ModerationQueue {
  events: Event[];
  total: number;
}

/**
 * Get events pending moderation
 */
export async function getModerationQueue(): Promise<ModerationQueue> {
  const response = await apiFetch('/events/moderation-queue');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch moderation queue: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Approve an event
 */
export async function approveEvent(eventId: string, reason?: string): Promise<{ message: string; event: Event }> {
  const response = await apiFetch(`/events/${eventId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to approve event: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Reject an event
 */
export async function rejectEvent(eventId: string, reason?: string): Promise<{ message: string; event: Event }> {
  const response = await apiFetch(`/events/${eventId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to reject event: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Check if current user has event moderation access
 */
export async function checkModerationAccess(): Promise<{ hasAccess: boolean }> {
  const response = await apiFetch('/events/moderation-access');
  
  if (!response.ok) {
    throw new Error(`Failed to check moderation access: ${response.statusText}`);
  }
  
  return response.json();
}