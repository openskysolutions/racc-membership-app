/** Pure rate-limit and duplicate decisions for creating referrals. */

export const MAX_REFERRALS_PER_USER_PER_DAY = 5;
export const MAX_REFERRALS_PER_BUSINESS_PER_WEEK = 20;
export const DUPLICATE_WINDOW_DAYS = 30;
export const OPEN_STATUSES = ['submitted', 'contacted', 'in_discussion'];

export interface Rejection {
  status: 429 | 409;
  message: string;
}

export function decideRateLimit(userCountLast24h: number, businessCountLast7d: number): Rejection | null {
  if (userCountLast24h >= MAX_REFERRALS_PER_USER_PER_DAY) {
    return { status: 429, message: `You can send up to ${MAX_REFERRALS_PER_USER_PER_DAY} referrals per day. Please try again tomorrow.` };
  }
  if (businessCountLast7d >= MAX_REFERRALS_PER_BUSINESS_PER_WEEK) {
    return { status: 429, message: `Your business has reached the limit of ${MAX_REFERRALS_PER_BUSINESS_PER_WEEK} referrals per week. Please try again later.` };
  }
  return null;
}

/** Emails: trimmed + lowercased. Otherwise phone-like: digits only. */
export function normalizeContact(contact: string): string {
  const t = contact.trim().toLowerCase();
  if (t.includes('@')) return t;
  const digits = t.replace(/\D/g, '');
  return digits || t;
}

export function decideDuplicate(
  existing: { leadPhone: string; leadEmail?: string | null; leadBusinessId?: string | null; status: string; createdAt: Date }[],
  lead: { phone: string; email?: string | null },
  now = new Date(),
  leadBusinessId?: string | null
): Rejection | null {
  const phone = normalizeContact(lead.phone);
  const email = lead.email ? normalizeContact(lead.email) : '';
  const cutoff = now.getTime() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const dup = existing.some(
    e =>
      (e.createdAt.getTime() >= cutoff || OPEN_STATUSES.includes(e.status)) &&
      ((!!phone && normalizeContact(e.leadPhone) === phone) ||
        (!!email && !!e.leadEmail && normalizeContact(e.leadEmail) === email) ||
        (!!leadBusinessId && e.leadBusinessId === leadBusinessId))
  );
  return dup
    ? { status: 409, message: 'You have already referred this lead to this business recently.' }
    : null;
}
