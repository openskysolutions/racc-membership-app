/** Pure rules for non-member (lead-gen) referrals. Nothing here touches I/O. */

import { normalizeContact } from '@/services/referralLimits';

export const MAX_NON_MEMBER_PER_USER_PER_DAY = 3;
export const MAX_NON_MEMBER_PER_BUSINESS_PER_WEEK = 10;
export const NON_MEMBER_EMAIL_COOLDOWN_DAYS = 90;
export const NON_MEMBER_DUPLICATE_LEAD_DAYS = 30;
export const NON_MEMBER_STATUSES = ['sent', 'joined', 'closed'] as const;
export type NonMemberStatus = (typeof NON_MEMBER_STATUSES)[number];

const DAY = 24 * 60 * 60 * 1000;

export interface NonMemberRejection {
  status: 400 | 409 | 429;
  message: string;
}

export function isNonMemberStatus(v: unknown): v is NonMemberStatus {
  return typeof v === 'string' && (NON_MEMBER_STATUSES as readonly string[]).includes(v);
}

/** Returns the normalized (trimmed, lowercased) email, or null if invalid or unsafe. */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const e = raw.trim().toLowerCase();
  if (e.length === 0 || e.length > 254) return null;
  if (/[\s,;<>"'\\\u0000-\u001f\u007f]/.test(e)) return null; // no whitespace/CRLF/header-injection chars
  if (!/^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(e)) return null;
  return e;
}

/** Strip control characters (incl. CR/LF) from a single-line free-text field. */
export function cleanLine(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Rejects if the business name or email already belongs to an active member / active user. */
export function decideMemberConflict(
  input: { businessName: string; email: string },
  activeMembers: { name?: string | null; email?: string | null }[],
  activeUserEmailExists: boolean
): NonMemberRejection | null {
  const n = normalizeName(input.businessName);
  const hit =
    activeUserEmailExists ||
    activeMembers.some(
      m => (m.name && n && normalizeName(m.name) === n) || (m.email && m.email.trim().toLowerCase() === input.email)
    );
  return hit
    ? { status: 400, message: 'That business is already a chamber member. Please use "Refer this member" from the member directory instead.' }
    : null;
}

export function decideNonMemberRateLimit(userCountLast24h: number, businessCountLast7d: number): NonMemberRejection | null {
  if (userCountLast24h >= MAX_NON_MEMBER_PER_USER_PER_DAY) {
    return { status: 429, message: `You can refer up to ${MAX_NON_MEMBER_PER_USER_PER_DAY} non-member businesses per day. Please try again tomorrow.` };
  }
  if (businessCountLast7d >= MAX_NON_MEMBER_PER_BUSINESS_PER_WEEK) {
    return { status: 429, message: `Your business has reached the limit of ${MAX_NON_MEMBER_PER_BUSINESS_PER_WEEK} non-member referrals per week. Please try again later.` };
  }
  return null;
}

/** Reject if this address already received a chamber referral email recently (from anyone). */
export function decideEmailCooldown(emailedAtDates: (Date | null)[], now = new Date()): NonMemberRejection | null {
  const cutoff = now.getTime() - NON_MEMBER_EMAIL_COOLDOWN_DAYS * DAY;
  return emailedAtDates.some(d => d && d.getTime() >= cutoff)
    ? { status: 409, message: 'That business was already contacted by the chamber recently. Please try again later.' }
    : null;
}

/** Same lead + same email within the duplicate window. */
export function decideNonMemberDuplicate(
  existing: { leadPhone: string; leadEmail?: string | null; createdAt: Date }[],
  lead: { phone: string; email?: string | null },
  now = new Date()
): NonMemberRejection | null {
  const phone = normalizeContact(lead.phone);
  const email = lead.email ? normalizeContact(lead.email) : '';
  const cutoff = now.getTime() - NON_MEMBER_DUPLICATE_LEAD_DAYS * DAY;
  return existing.some(
    e =>
      e.createdAt.getTime() >= cutoff &&
      ((!!phone && normalizeContact(e.leadPhone) === phone) ||
        (!!email && !!e.leadEmail && normalizeContact(e.leadEmail) === email))
  )
    ? { status: 409, message: 'This lead has already been referred to that business recently.' }
    : null;
}

export interface NonMemberRow {
  id: number;
  referrerBusinessId: string;
  referrerUserId: number;
  businessName: string;
  contactName: string | null;
  email: string;
  phone: string | null;
  leadName: string;
  leadPhone: string;
  leadEmail: string | null;
  leadBusinessName: string | null;
  note: string | null;
  temperature: string | null;
  status: string;
  emailSentAt: Date | null;
  hiddenByAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** For the referring business only (includes their own lead info). */
export function toNonMemberGivenView(r: NonMemberRow) {
  return {
    id: r.id,
    kind: 'non_member' as const,
    direction: 'given' as const,
    businessName: r.businessName,
    contactName: r.contactName,
    email: r.email,
    phone: r.phone,
    leadName: r.leadName,
    leadPhone: r.leadPhone,
    leadEmail: r.leadEmail,
    leadBusinessName: r.leadBusinessName,
    note: r.note,
    temperature: r.temperature,
    status: r.status,
    emailSentAt: r.emailSentAt,
    createdAt: r.createdAt,
  };
}

/** Admin lead-gen list: deliberately omits lead name/contact/note. */
export function toNonMemberAdminView(r: NonMemberRow, referrerBusinessName: string) {
  return {
    id: r.id,
    businessName: r.businessName,
    contactName: r.contactName,
    email: r.email,
    phone: r.phone,
    referrerBusinessId: r.referrerBusinessId,
    referrerBusinessName,
    status: r.status,
    emailSentAt: r.emailSentAt,
    hiddenByAdmin: r.hiddenByAdmin,
    createdAt: r.createdAt,
  };
}
