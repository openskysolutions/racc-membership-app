/**
 * Pure referral rules: status transitions and privacy-safe serializers.
 * Kept free of I/O so they can be unit tested without Prisma.
 */

export const REFERRAL_STATUSES = [
  'submitted',
  'contacted',
  'in_discussion',
  'closed_won',
  'closed_lost',
  'not_a_fit',
] as const;

export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const REFERRAL_TEMPERATURES = ['hot', 'warm', 'cold'] as const;

const TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  submitted: ['contacted', 'in_discussion', 'closed_won', 'closed_lost', 'not_a_fit'],
  contacted: ['in_discussion', 'closed_won', 'closed_lost', 'not_a_fit'],
  in_discussion: ['closed_won', 'closed_lost', 'not_a_fit'],
  closed_won: [],
  closed_lost: [],
  not_a_fit: [],
};

export function isReferralStatus(value: unknown): value is ReferralStatus {
  return typeof value === 'string' && (REFERRAL_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: string, to: string): boolean {
  if (!isReferralStatus(from) || !isReferralStatus(to)) return false;
  return TRANSITIONS[from].includes(to);
}

export interface ReferralRow {
  id: number;
  referrerBusinessId: string;
  referrerUserId: number;
  recipientBusinessId: string;
  recipientUserId?: number | null;
  leadBusinessId?: string | null;
  leadName: string;
  leadPhone: string;
  leadEmail?: string | null;
  leadBusinessName?: string | null;
  note: string | null;
  temperature: string | null;
  status: string;
  hiddenByAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  testimonials?: { id: number; authorUserId: number; body: string; createdAt: Date }[];
}

export interface RecipientActor {
  id: number;
  role?: string;
  ghlBusinessId?: string | null;
}

/**
 * Recipient-side permission: user must belong to the recipient business and, when the
 * referral targets a specific person, be that person (or an admin of that business).
 */
export function canActAsRecipient(
  referral: { recipientBusinessId: string; recipientUserId?: number | null },
  user: RecipientActor
): boolean {
  if (!user.ghlBusinessId || user.ghlBusinessId !== referral.recipientBusinessId) return false;
  if (referral.recipientUserId == null) return true;
  return referral.recipientUserId === user.id || user.role === 'admin';
}

/** Lead details for an introduction, derived from directory data (business-level contact only). */
export function deriveMemberLead(business: { name?: string; email?: string | null; phone?: string | null; website?: string | null }) {
  const name = (business.name ?? '').trim();
  return { leadName: name, leadPhone: (business.phone ?? '').trim(), leadEmail: (business.email ?? '').trim() || null };
}

export type BusinessNames = Record<string, string>;

function nameOf(names: BusinessNames, id: string): string {
  return names[id] ?? 'Unknown business';
}

/** Public feed item: only the business pairing, never lead name/contact/note. */
export function toFeedItem(r: ReferralRow, names: BusinessNames) {
  return {
    id: r.id,
    referrerBusinessId: r.referrerBusinessId,
    referrerBusinessName: nameOf(names, r.referrerBusinessId),
    recipientBusinessId: r.recipientBusinessId,
    recipientBusinessName: nameOf(names, r.recipientBusinessId),
    closedWon: r.status === 'closed_won',
    createdAt: r.createdAt,
    testimonials: (r.testimonials ?? []).map(t => ({
      id: t.id,
      body: t.body,
      createdAt: t.createdAt,
    })),
  };
}

/** Full view for the two participating businesses (includes lead details). */
export function toParticipantView(
  r: ReferralRow,
  names: BusinessNames,
  businessId: string,
  recipientUserName?: string | null
) {
  return {
    id: r.id,
    referrerBusinessId: r.referrerBusinessId,
    referrerBusinessName: nameOf(names, r.referrerBusinessId),
    recipientBusinessId: r.recipientBusinessId,
    recipientBusinessName: nameOf(names, r.recipientBusinessId),
    direction: r.referrerBusinessId === businessId ? 'given' : 'received',
    recipientUserId: r.recipientUserId ?? null,
    recipientUserName: r.recipientUserId != null ? recipientUserName ?? null : null,
    leadBusinessId: r.leadBusinessId ?? null,
    leadIsMember: r.leadBusinessId != null,
    leadName: r.leadName,
    leadPhone: r.leadPhone,
    leadEmail: r.leadEmail ?? null,
    leadBusinessName: r.leadBusinessName ?? null,
    note: r.note,
    temperature: r.temperature,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    testimonials: (r.testimonials ?? []).map(t => ({
      id: t.id,
      body: t.body,
      createdAt: t.createdAt,
    })),
  };
}

/** Admin moderation view: lead identity/contact/note deliberately omitted. */
export function toAdminView(r: ReferralRow, names: BusinessNames) {
  return {
    id: r.id,
    referrerBusinessId: r.referrerBusinessId,
    referrerBusinessName: nameOf(names, r.referrerBusinessId),
    recipientBusinessId: r.recipientBusinessId,
    recipientBusinessName: nameOf(names, r.recipientBusinessId),
    temperature: r.temperature,
    status: r.status,
    hiddenByAdmin: r.hiddenByAdmin,
    introduction: r.leadBusinessId != null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    testimonialCount: r.testimonials?.length ?? 0,
  };
}
