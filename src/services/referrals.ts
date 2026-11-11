import { api } from '@/services/apiClient';

export type ReferralStatus =
  | 'submitted'
  | 'contacted'
  | 'in_discussion'
  | 'closed_won'
  | 'closed_lost'
  | 'not_a_fit';

export type ReferralTemperature = 'hot' | 'warm' | 'cold';

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  submitted: 'Submitted',
  contacted: 'Contacted',
  in_discussion: 'In Discussion',
  closed_won: 'Closed - Won',
  closed_lost: 'Closed - Lost',
  not_a_fit: 'Not a Fit',
};

// Mirrors the backend transition rules (ghl-api/src/services/referralRules.ts)
export const REFERRAL_NEXT_STATUSES: Record<ReferralStatus, ReferralStatus[]> = {
  submitted: ['contacted', 'in_discussion', 'closed_won', 'closed_lost', 'not_a_fit'],
  contacted: ['in_discussion', 'closed_won', 'closed_lost', 'not_a_fit'],
  in_discussion: ['closed_won', 'closed_lost', 'not_a_fit'],
  closed_won: [],
  closed_lost: [],
  not_a_fit: [],
};

export interface ReferralTestimonial {
  id: number;
  body: string;
  createdAt: string;
}

export interface Referral {
  id: number;
  referrerBusinessId: string;
  referrerBusinessName: string;
  recipientBusinessId: string;
  recipientBusinessName: string;
  recipientUserId: number | null;
  recipientUserName: string | null;
  direction: 'given' | 'received';
  leadBusinessId: string | null;
  leadIsMember: boolean;
  leadName: string;
  leadPhone: string;
  leadEmail: string | null;
  leadBusinessName: string | null;
  note: string | null;
  temperature: ReferralTemperature | null;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
  testimonials: ReferralTestimonial[];
}

export interface FeedItem {
  id: number;
  referrerBusinessId: string;
  referrerBusinessName: string;
  recipientBusinessId: string;
  recipientBusinessName: string;
  closedWon: boolean;
  createdAt: string;
  testimonials: ReferralTestimonial[];
}

export interface CreateReferralInput {
  recipientBusinessId: string;
  recipientUserId?: number;
  leadBusinessId?: string;
  leadName?: string;
  leadPhone?: string;
  leadEmail?: string;
  leadBusinessName?: string;
  note?: string;
  temperature?: ReferralTemperature;
}

export interface AdminReferral {
  id: number;
  referrerBusinessId: string;
  referrerBusinessName: string;
  recipientBusinessId: string;
  recipientBusinessName: string;
  temperature: ReferralTemperature | null;
  status: ReferralStatus;
  hiddenByAdmin: boolean;
  introduction?: boolean;
  createdAt: string;
  updatedAt: string;
  testimonialCount: number;
}

export interface AdminReferralStats {
  total: number;
  closedWon: number;
  hidden: number;
  topConnector: { businessId: string; name: string; count: number } | null;
  nonMemberTotal: number;
}

async function parse<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || fallback);
  }
  return response.json();
}

export async function createReferral(input: CreateReferralInput): Promise<Referral> {
  return parse(await api.post('/referrals', input), 'Failed to submit referral');
}

export async function getMyReferrals(direction?: 'given' | 'received'): Promise<Referral[]> {
  const qs = direction ? `?direction=${direction}` : '';
  const data = await parse<{ referrals: Referral[] }>(await api.get(`/referrals/mine${qs}`), 'Failed to load referrals');
  return data.referrals;
}

export async function updateReferralStatus(id: number, status: ReferralStatus): Promise<Referral> {
  return parse(await api.patch(`/referrals/${id}/status`, { status }), 'Failed to update status');
}

export async function addTestimonial(id: number, body: string): Promise<ReferralTestimonial> {
  return parse(await api.post(`/referrals/${id}/testimonial`, { body }), 'Failed to post thank-you');
}

export async function getPublicFeed(limit = 50): Promise<FeedItem[]> {
  const data = await parse<{ items: FeedItem[] }>(await api.get(`/referrals/feed?limit=${limit}`), 'Failed to load referral feed');
  return data.items;
}

export async function getAdminReferrals(
  filters: { status?: string; hidden?: 'true' | 'false' } = {}
): Promise<{ referrals: AdminReferral[]; nonMemberReferrals: AdminNonMemberReferral[]; stats: AdminReferralStats }> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.hidden) params.set('hidden', filters.hidden);
  const qs = params.toString();
  return parse(await api.get(`/admin/referrals${qs ? `?${qs}` : ''}`), 'Failed to load referrals');
}

export async function adminModerateReferral(
  id: number,
  changes: { hiddenByAdmin?: boolean; status?: ReferralStatus }
): Promise<AdminReferral> {
  return parse(await api.patch(`/admin/referrals/${id}`, changes), 'Failed to update referral');
}

export type ReferralTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LeaderboardEntry {
  rank: number;
  businessId: string;
  businessName: string;
  points: number;
  tier: ReferralTier;
  referralsGiven: number;
  closedWon: number;
  testimonials: number;
}

export async function getLeaderboard(period: 'month' | 'all'): Promise<LeaderboardEntry[]> {
  const data = await parse<{ entries: LeaderboardEntry[] }>(
    await api.get(`/referrals/leaderboard?period=${period}`),
    'Failed to load leaderboard'
  );
  return data.entries;
}

export interface ReferralRecipient {
  id: number;
  name: string;
}

export async function getRecipients(businessId: string): Promise<ReferralRecipient[]> {
  const data = await parse<{ recipients: ReferralRecipient[] }>(
    await api.get(`/referrals/recipients/${encodeURIComponent(businessId)}`),
    'Failed to load team members'
  );
  return data.recipients;
}

export type NonMemberStatus = 'sent' | 'joined' | 'closed';

export const NON_MEMBER_STATUS_LABELS: Record<NonMemberStatus, string> = {
  sent: 'Sent',
  joined: 'Joined',
  closed: 'Closed',
};

export interface NonMemberReferral {
  id: number;
  kind: 'non_member';
  direction: 'given';
  businessName: string;
  contactName: string | null;
  email: string;
  phone: string | null;
  leadName: string;
  leadPhone: string;
  leadEmail: string | null;
  leadBusinessName: string | null;
  note: string | null;
  temperature: ReferralTemperature | null;
  status: NonMemberStatus;
  emailSentAt: string | null;
  createdAt: string;
}

export interface CreateNonMemberReferralInput {
  businessName: string;
  email: string;
  contactName?: string;
  phone?: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  leadBusinessName?: string;
  note?: string;
  temperature?: ReferralTemperature;
}

export async function createNonMemberReferral(
  input: CreateNonMemberReferralInput
): Promise<{ referral: NonMemberReferral; emailSent: boolean }> {
  return parse(await api.post('/referrals/non-member', input), 'Failed to submit referral');
}

export async function getMyNonMemberReferrals(): Promise<NonMemberReferral[]> {
  const data = await parse<{ nonMemberReferrals?: NonMemberReferral[] }>(
    await api.get('/referrals/mine?direction=given'),
    'Failed to load referrals'
  );
  return data.nonMemberReferrals ?? [];
}

export interface AdminNonMemberReferral {
  id: number;
  businessName: string;
  contactName: string | null;
  email: string;
  phone: string | null;
  referrerBusinessId: string;
  referrerBusinessName: string;
  status: NonMemberStatus;
  emailSentAt: string | null;
  hiddenByAdmin: boolean;
  createdAt: string;
}

export async function adminModerateNonMember(
  id: number,
  changes: { status?: NonMemberStatus; hiddenByAdmin?: boolean }
): Promise<AdminNonMemberReferral> {
  return parse(await api.patch(`/admin/referrals/non-member/${id}`, changes), 'Failed to update referral');
}

export interface DirectoryMember {
  id: string;
  businessName: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
}

/** Active member businesses (same source as the Members directory). */
export async function getActiveMemberDirectory(): Promise<DirectoryMember[]> {
  const data = await parse<{ members?: DirectoryMember[] }>(await api.get('/businesses?source=ReferralPicker'), 'Failed to load members');
  return data.members ?? [];
}

export function memberContactSummary(m: DirectoryMember): string {
  return [m.email, m.phone, m.website].find(v => v && v.trim()) || 'See member directory';
}
