/** Shared GHL business helpers and the directory's "active member" rule. */

export const RENEWAL_GRACE_MONTHS = 13;

/** Read a custom field from a GHL Business object's customFields array. */
export function getBusinessProp(business: any, key: string): string | null {
  const field = (business?.customFields ?? []).find((f: any) => f.key === key);
  return field?.valueString ?? field?.valueDate ?? null;
}

/**
 * Active member = membership_tier set, membership_status 'active', and a
 * renewal_date within the last RENEWAL_GRACE_MONTHS months.
 */
export function isActiveMember(business: any, now = new Date()): boolean {
  if (!business) return false;
  if (!getBusinessProp(business, 'membership_tier')) return false;
  if (getBusinessProp(business, 'membership_status') !== 'active') return false;
  const renewal = getBusinessProp(business, 'renewal_date');
  if (!renewal) return false;
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - RENEWAL_GRACE_MONTHS);
  return new Date(renewal) >= cutoff;
}
