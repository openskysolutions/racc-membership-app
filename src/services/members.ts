// In dev use the Vite proxy; in prod use the real API endpoint
const GHL_API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_GHL_API_URL || 'https://services.leadconnectorhq.com');
const GHL_LOCATION_ID = '5FAB1z0AhuVlEdqOzjVX';
const GHL_GROUP_ID = '68adda340bfd81f359ce2de9';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import type { Member } from '@/types/member';
import { apiFetch } from '@/services/apiClient';

/**
 * Fetch paginated active members via contacts/search proxy
 * Auto-filters by this group ID
 */
export async function getMembersList(
  page = 1,
  pageLimit = 20
): Promise<Member[]> {
  const url = `${API_BASE_URL}/contacts/membersList`;
  const body = {
    page,
    pageLimit,
    sort: [],
  };
  const response = await apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Error fetching members: ${response.statusText}`);
  }
  const data = await response.json();
  return data.contacts;
}

// add get contact function that cause this end point: https://services.leadconnectorhq.com/contacts/{contactId}

export async function getContactById(contactId: string): Promise<Member> {
  const url = `${API_BASE_URL}/contacts/${contactId}`;
  const response = await apiFetch(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Error fetching contact: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}

/** Fetch single member details by slug */
export async function getMemberBySlug(slug: string): Promise<Member> {
  const url = `${GHL_API_BASE_URL}/communities/${GHL_LOCATION_ID}/groups/${GHL_GROUP_ID}/users?slug=${encodeURIComponent(slug)}&isGokollabUser=false`;
  console.log('Fetching member by slug URL:', url);
  const response = await apiFetch(url, { method: 'GET' });
  if (!response.ok) throw new Error(`Failed to fetch member: ${response.statusText}`);
  const data = await response.json();
  console.log('Member fetch response data:', data);
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('Member not found');
  }
  return Array.isArray(data) ? data[0] : data;
}

/** Fetch posts for a member by slug */
export async function getMemberPosts(slug: string): Promise<any[]> {
  const url = `${GHL_API_BASE_URL}/communities/${GHL_LOCATION_ID}/groups/${GHL_GROUP_ID}/posts?slug=${encodeURIComponent(slug)}&limit=20`;
  const res = await apiFetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.statusText}`);
  const json = await res.json();
  return json?.data || json;
}

/** Fetch events for a member by slug between today and tomorrow */
export async function getMemberEvents(slug: string): Promise<any[]> {
  const now = new Date();
  const startDate = new Date(now.setHours(0,0,0,0)).toISOString();
  const endDate = new Date(Date.now() + 24*60*60*1000).toISOString();
  const url = `${GHL_API_BASE_URL}/communities/${GHL_LOCATION_ID}/groups/${GHL_GROUP_ID}/events?slug=${encodeURIComponent(slug)}&startDate=${startDate}&endDate=${endDate}`;
  const res = await apiFetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.statusText}`);
  const json = await res.json();
  return json?.data || json;
}