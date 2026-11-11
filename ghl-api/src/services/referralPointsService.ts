/**
 * Referral points: pure scoring rules plus a transactional recompute into ReferralPoints.
 *
 * Rules:
 *  - A referral counts only once acknowledged (status != submitted) and not hidden by admin.
 *  - Referrer: +1 (given) +1 (accepted) when acknowledged, +5 more when closed_won.
 *  - Recipient: +1 per thank-you testimonial posted.
 *  - At most MAX_COUNTED_PER_PAIR acknowledged referrals per referrer->recipient pair score
 *    (all-time, or per calendar month for the monthly view).
 *  - Monthly view attributes a referral and its testimonials to the month they were created
 *    (createdAt), since updatedAt also changes on unrelated edits and admin moderation.
 */

import { prisma } from '@/lib/prisma';

export const POINTS_GIVEN = 1;
export const POINTS_ACCEPTED = 1;
export const POINTS_CLOSED_WON = 5;
export const POINTS_TESTIMONIAL = 1;
export const MAX_COUNTED_PER_PAIR = 3;
/** Member-to-member introductions (leadBusinessId set) earn no points. Flip to true to score them. */
export const INTRODUCTIONS_EARN_POINTS = false;

export const TIER_THRESHOLDS = { bronze: 5, silver: 15, gold: 40, platinum: 100 } as const;
export type Tier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ScorableReferral {
  referrerBusinessId: string;
  recipientBusinessId: string;
  status: string;
  hiddenByAdmin: boolean;
  leadBusinessId?: string | null;
  createdAt: Date;
  testimonials?: { createdAt: Date }[];
}

export interface BusinessScore {
  businessId: string;
  points: number;
  given: number;
  closedWon: number;
  testimonials: number;
}

/** One predicate for everything that scores: points, per-pair cap and testimonials. */
export function isScoringReferral(r: ScorableReferral): boolean {
  if (r.hiddenByAdmin) return false;
  return INTRODUCTIONS_EARN_POINTS || r.leadBusinessId == null;
}

export function tierForPoints(points: number): Tier {
  if (points >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (points >= TIER_THRESHOLDS.gold) return 'gold';
  if (points >= TIER_THRESHOLDS.silver) return 'silver';
  if (points >= TIER_THRESHOLDS.bronze) return 'bronze';
  return 'none';
}

/** Compute scores for every business in the given referrals. Optional [from, to) window on createdAt. */
export function computeScores(
  referrals: ScorableReferral[],
  window?: { from: Date; to: Date }
): Map<string, BusinessScore> {
  const scores = new Map<string, BusinessScore>();
  const get = (id: string) => {
    let s = scores.get(id);
    if (!s) {
      s = { businessId: id, points: 0, given: 0, closedWon: 0, testimonials: 0 };
      scores.set(id, s);
    }
    return s;
  };

  const inWindow = (d: Date) => !window || (d >= window.from && d < window.to);
  const eligible = referrals
    .filter(r => isScoringReferral(r) && r.status !== 'submitted' && inWindow(r.createdAt))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const pairCounts = new Map<string, number>();
  for (const r of eligible) {
    const key = `${r.referrerBusinessId}->${r.recipientBusinessId}`;
    const n = pairCounts.get(key) ?? 0;
    if (n >= MAX_COUNTED_PER_PAIR) continue;
    pairCounts.set(key, n + 1);

    const s = get(r.referrerBusinessId);
    s.given += 1;
    s.points += POINTS_GIVEN + POINTS_ACCEPTED;
    if (r.status === 'closed_won') {
      s.closedWon += 1;
      s.points += POINTS_CLOSED_WON;
    }
  }

  for (const r of referrals) {
    if (!isScoringReferral(r)) continue;
    const count = (r.testimonials ?? []).filter(t => inWindow(t.createdAt)).length;
    if (count === 0) continue;
    const s = get(r.recipientBusinessId);
    s.testimonials += count;
    s.points += count * POINTS_TESTIMONIAL;
  }

  return scores;
}

export function monthWindow(now = new Date()): { from: Date; to: Date } {
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

/**
 * Recompute all-time points for the given businesses in one transaction.
 * Monthly caps are applied per month at read time, so only all-time is persisted.
 */
export async function recomputePoints(businessIds: string[]): Promise<void> {
  const ids = [...new Set(businessIds)];
  if (ids.length === 0) return;
  await prisma.$transaction(async tx => {
    const rows = (await tx.referral.findMany({
      where: {
        hiddenByAdmin: false,
        OR: [{ referrerBusinessId: { in: ids } }, { recipientBusinessId: { in: ids } }],
      },
      include: { testimonials: { select: { createdAt: true } } },
    })) as ScorableReferral[];
    const scores = computeScores(rows);
    for (const id of ids) {
      const points = scores.get(id)?.points ?? 0;
      const tier = tierForPoints(points);
      await tx.referralPoints.upsert({
        where: { businessId: id },
        create: { businessId: id, points, tier },
        update: { points, tier },
      });
    }
  });
}
