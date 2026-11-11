import { describe, it, expect, vi } from 'vitest';

const tx = vi.hoisted(() => ({
  referral: { findMany: vi.fn() },
  referralPoints: { upsert: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: (fn: any) => fn(tx) } }));

import { computeScores, tierForPoints, recomputePoints, monthWindow, TIER_THRESHOLDS } from '@/services/referralPointsService';
import { decideRateLimit, decideDuplicate, normalizeContact } from '@/services/referralLimits';

const d = (s: string) => new Date(s);
const ref = (o: any = {}) => ({
  referrerBusinessId: 'A', recipientBusinessId: 'B', status: 'contacted',
  hiddenByAdmin: false, createdAt: d('2026-05-10'), testimonials: [], ...o,
});

describe('points', () => {
  it('ignores unacknowledged and hidden referrals', () => {
    const s = computeScores([ref({ status: 'submitted' }), ref({ hiddenByAdmin: true, status: 'closed_won' })]);
    expect(s.size).toBe(0);
  });
  it('gives 2 for acknowledged, +5 for closed_won, +1 per testimonial to recipient', () => {
    const s = computeScores([
      ref(),
      ref({ status: 'closed_won', recipientBusinessId: 'C', testimonials: [{ createdAt: d('2026-05-11') }] }),
    ]);
    expect(s.get('A')!.points).toBe(2 + 7);
    expect(s.get('C')!.points).toBe(1);
  });
  it('caps counted referrals per pair at 3', () => {
    const rows = [1, 2, 3, 4, 5].map(i => ref({ createdAt: d(`2026-05-0${i}`) }));
    expect(computeScores(rows).get('A')!.points).toBe(6);
  });
  it('applies the cap per month in the monthly window', () => {
    const rows = [
      ...[1, 2, 3, 4].map(i => ref({ createdAt: d(`2026-04-0${i}`) })),
      ref({ createdAt: d('2026-05-02') }),
    ];
    expect(computeScores(rows).get('A')!.points).toBe(6);
    expect(computeScores(rows, { from: d('2026-05-01'), to: d('2026-06-01') }).get('A')!.points).toBe(2);
    expect(monthWindow(d('2026-05-15')).to.getMonth()).toBe(5);
  });
});

describe('introductions earn no points', () => {
  const intro = (o: any = {}) => ref({ leadBusinessId: 'L', ...o });
  it('are excluded entirely, including closed_won and testimonials', () => {
    const s = computeScores([intro({ status: 'closed_won', testimonials: [{ createdAt: d('2026-05-11') }] })]);
    expect(s.size).toBe(0);
  });
  it('do not consume per-pair cap slots', () => {
    const rows = [
      ...[1, 2, 3].map(i => intro({ createdAt: d(`2026-05-0${i}`) })),
      ...[4, 5, 6].map(i => ref({ createdAt: d(`2026-05-0${i}`) })),
    ];
    expect(computeScores(rows).get('A')!.points).toBe(6);
  });
  it('are excluded from the monthly window too', () => {
    const rows = [intro({ createdAt: d('2026-05-02') }), ref({ createdAt: d('2026-05-03') })];
    expect(computeScores(rows, { from: d('2026-05-01'), to: d('2026-06-01') }).get('A')!.points).toBe(2);
  });
});

describe('tiers', () => {
  it('maps thresholds', () => {
    expect(tierForPoints(TIER_THRESHOLDS.bronze - 1)).toBe('none');
    expect(tierForPoints(TIER_THRESHOLDS.bronze)).toBe('bronze');
    expect(tierForPoints(TIER_THRESHOLDS.silver)).toBe('silver');
    expect(tierForPoints(TIER_THRESHOLDS.gold)).toBe('gold');
    expect(tierForPoints(TIER_THRESHOLDS.platinum)).toBe('platinum');
  });
});

describe('recomputePoints', () => {
  it('upserts points and tier for each business in a transaction', async () => {
    tx.referral.findMany.mockResolvedValue([ref({ status: 'closed_won' })]);
    await recomputePoints(['A', 'B', 'A']);
    expect(tx.referralPoints.upsert).toHaveBeenCalledTimes(2);
    const a = tx.referralPoints.upsert.mock.calls.find(c => c[0].where.businessId === 'A')![0];
    expect(a.update).toEqual({ points: 7, tier: 'bronze' });
    expect(tx.referral.findMany.mock.calls[0][0].where.hiddenByAdmin).toBe(false);
  });
});

describe('limits', () => {
  it('rate limits per user and per business', () => {
    expect(decideRateLimit(4, 19)).toBeNull();
    expect(decideRateLimit(5, 0)?.status).toBe(429);
    expect(decideRateLimit(0, 20)?.status).toBe(429);
  });
  it('normalizes contacts', () => {
    expect(normalizeContact(' Foo@Bar.COM ')).toBe('foo@bar.com');
    expect(normalizeContact('(435) 555-0101')).toBe('4355550101');
  });
  it('detects duplicates in window or still open, ignores old closed', () => {
    const now = d('2026-06-01');
    const phone = '435-555-0101';
    expect(decideDuplicate([{ leadPhone: '(435) 555 0101', status: 'closed_lost', createdAt: d('2026-05-20') }], { phone }, now)?.status).toBe(409);
    expect(decideDuplicate([{ leadPhone: phone, status: 'contacted', createdAt: d('2026-01-01') }], { phone }, now)?.status).toBe(409);
    expect(decideDuplicate([{ leadPhone: phone, status: 'closed_won', createdAt: d('2026-01-01') }], { phone }, now)).toBeNull();
    expect(decideDuplicate([{ leadPhone: '435-555-9999', status: 'submitted', createdAt: d('2026-05-30') }], { phone }, now)).toBeNull();
    // same email, different phone -> duplicate
    expect(decideDuplicate([{ leadPhone: '435-555-9999', leadEmail: 'X@y.com', status: 'submitted', createdAt: d('2026-05-30') }], { phone, email: 'x@y.com' }, now)?.status).toBe(409);
  });
});
