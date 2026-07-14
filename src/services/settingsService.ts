import { api } from './apiClient';

/**
 * Get the GHL event ID currently marked as featured on the homepage.
 * Returns null if none is set.
 */
export async function getFeaturedEventId(): Promise<string | null> {
  const response = await api.get('/settings/featured-event');
  if (!response.ok) throw new Error('Failed to fetch featured event setting');
  const data = await response.json();
  return data.eventId ?? null;
}

/**
 * Set or clear the featured event. Pass null to clear.
 * Admin only.
 */
export async function setFeaturedEventId(eventId: string | null): Promise<void> {
  const response = await api.put('/settings/featured-event', { eventId });
  if (!response.ok) throw new Error('Failed to update featured event setting');
}
