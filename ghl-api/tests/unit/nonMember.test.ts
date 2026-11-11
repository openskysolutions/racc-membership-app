import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  nonMemberReferral: { count: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  user: { findFirst: vi.fn() },
}));
const emailMock = vi.hoisted(() => ({ sendNonMemberReferralEmail: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/services/emailService', () => ({ emailService: emailMock }));
vi.mock('@/services/gohighlevel', () => ({ ghlService: { getBusinessById: vi.fn(async () => ({ name: 'Referrer Co' })) } }));
vi.mock('@/services/directoryCache', () => ({ refreshDirectoryCache: vi.fn() }));
const cacheItems = vi.hoisted(() => ({ list: [] as any[] }));
vi.mock('@/services/contactsCache', () => ({
  businessesCache: { get: () => cacheItems.list, getStale: () => cacheItems.list },
  contactsCache: { getByBusinessId: () => null, getStale: () => null },
}));

import controller from '@/controllers/nonMemberReferralsController';
import {
  normalizeEmail, decideMemberConflict, decideNonMemberRateLimit, decideEmailCooldown,
  decideNonMemberDuplicate, toNonMemberAdminView, toNonMemberGivenView,
} from '@/services/nonMemberReferralRules';
import { isActiveMember } from '@/utils/activeMember';
import { generateNonMemberInviteEmail, generateNonMemberInviteEmailText } from '@/templates/emails/referralEmail';

const cf = (o: Record<string, string>) => ({ customFields: Object.entries(o).map(([key, valueString]) => ({ key, valueString })) });
const d = (s: string) => new Date(s);

describe('isActiveMember', () => {
  const now = d('2026-06-01');
  const good = cf({ membership_tier: 'basic_membership_package', membership_status: 'active', renewal_date: '2026-01-01' });
  it('accepts tier + active + recent renewal', () => expect(isActiveMember(good, now)).toBe(true));
  it('rejects missing tier, inactive, stale or missing renewal, null', () => {
    expect(isActiveMember(cf({ membership_status: 'active', renewal_date: '2026-01-01' }), now)).toBe(false);
    expect(isActiveMember(cf({ membership_tier: 'x', membership_status: 'lapsed', renewal_date: '2026-01-01' }), now)).toBe(false);
    expect(isActiveMember(cf({ membership_tier: 'x', membership_status: 'active', renewal_date: '2024-01-01' }), now)).toBe(false);
    expect(isActiveMember(cf({ membership_tier: 'x', membership_status: 'active' }), now)).toBe(false);
    expect(isActiveMember(null, now)).toBe(false);
  });
});

describe('non-member rules', () => {
  it('validates and normalizes email', () => {
    expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com');
    expect(normalizeEmail('a@b')).toBeNull();
    expect(normalizeEmail('a@b.com\r\nBcc: x@y.com')).toBeNull();
    expect(normalizeEmail('a@b.com,c@d.com')).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
  });
  it('detects existing member by name or email, or active user', () => {
    const members = [{ name: 'Acme, Inc.', email: 'hi@acme.com' }];
    expect(decideMemberConflict({ businessName: 'acme inc', email: 'x@y.com' }, members, false)?.status).toBe(400);
    expect(decideMemberConflict({ businessName: 'Other', email: 'hi@acme.com' }, members, false)?.status).toBe(400);
    expect(decideMemberConflict({ businessName: 'Other', email: 'x@y.com' }, members, true)?.status).toBe(400);
    expect(decideMemberConflict({ businessName: 'Other', email: 'x@y.com' }, members, false)).toBeNull();
  });
  it('rate limits 3/day per user and 10/week per business', () => {
    expect(decideNonMemberRateLimit(2, 9)).toBeNull();
    expect(decideNonMemberRateLimit(3, 0)?.status).toBe(429);
    expect(decideNonMemberRateLimit(0, 10)?.status).toBe(429);
  });
  it('enforces 90-day email cooldown', () => {
    const now = d('2026-06-01');
    expect(decideEmailCooldown([d('2026-05-01')], now)?.status).toBe(409);
    expect(decideEmailCooldown([d('2026-01-01'), null], now)).toBeNull();
  });
  it('detects duplicate lead within 30 days', () => {
    const now = d('2026-06-01');
    expect(decideNonMemberDuplicate([{ leadPhone: '(435) 555-0101', createdAt: d('2026-05-20') }], { phone: '435-555-0101' }, now)?.status).toBe(409);
    expect(decideNonMemberDuplicate([{ leadPhone: '435-555-0101', createdAt: d('2026-03-01') }], { phone: '435-555-0101' }, now)).toBeNull();
  });
});

describe('serializers and email privacy', () => {
  const row: any = {
    id: 1, referrerBusinessId: 'A', referrerUserId: 1, businessName: 'Biz', contactName: 'Pat', email: 'p@biz.com',
    phone: '555', leadName: 'Secret Lead', leadPhone: '435-555-0100', leadEmail: 'lead@x.com', leadBusinessName: 'Lead Co', note: 'private note', temperature: 'hot',
    status: 'sent', emailSentAt: null, hiddenByAdmin: false, createdAt: new Date(), updatedAt: new Date(),
  };
  it('admin view omits lead details and note', () => {
    const json = JSON.stringify(toNonMemberAdminView(row, 'Referrer Co'));
    for (const secret of ['Secret Lead', 'lead@x.com', 'private note']) expect(json).not.toContain(secret);
    expect(json).toContain('p@biz.com');
  });
  it('given view includes the referrer\'s own lead info', () => {
    expect(toNonMemberGivenView(row).leadName).toBe('Secret Lead');
  });
  it('email escapes user values and contains no lead details', () => {
    const p = { contactName: '<script>x</script>', businessName: 'A & "B" <i>', referrerBusinessName: '<b>Ref</b>', joinUrl: 'https://x.test/join' };
    const html = generateNonMemberInviteEmail(p);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>Ref</b>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('https://x.test/join');
    for (const t of [html, generateNonMemberInviteEmailText(p)]) {
      for (const secret of ['Secret Lead', 'lead@x.com', 'private note']) expect(t).not.toContain(secret);
    }
  });
});

function mockRes() {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (b: any) => { res.body = b; return res; };
  return res;
}
const req = (body: any = {}) => ({
  user: { id: '1', ghlBusinessId: 'A' },
  body: { businessName: 'Biz', email: 'p@biz.com', leadName: 'Lead', leadPhone: '435-555-0111', leadEmail: 'l@x.com', ...body },
}) as any;

describe('create controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheItems.list = [];
    prismaMock.nonMemberReferral.count.mockResolvedValue(0);
    prismaMock.nonMemberReferral.findMany.mockResolvedValue([]);
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.nonMemberReferral.create.mockResolvedValue({ id: 1, leadName: 'Lead', status: 'sent', emailSentAt: null });
    prismaMock.nonMemberReferral.update.mockResolvedValue({ id: 1, leadName: 'Lead', status: 'sent', emailSentAt: new Date() });
  });

  it('rejects invalid email without saving', async () => {
    const res = mockRes();
    await controller.create(req({ email: 'bad' }), res);
    expect(res.statusCode).toBe(400);
    expect(prismaMock.nonMemberReferral.create).not.toHaveBeenCalled();
  });

  it('rejects when an active user has the email', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 9 });
    const res = mockRes();
    await controller.create(req(), res);
    expect(res.statusCode).toBe(400);
    expect(emailMock.sendNonMemberReferralEmail).not.toHaveBeenCalled();
  });

  it('saves and reports emailSent true on success', async () => {
    emailMock.sendNonMemberReferralEmail.mockResolvedValue(true);
    const res = mockRes();
    await controller.create(req(), res);
    expect(res.statusCode).toBe(201);
    expect(res.body.emailSent).toBe(true);
    expect(prismaMock.nonMemberReferral.update).toHaveBeenCalled();
  });

  it('still saves when the send fails or throws', async () => {
    emailMock.sendNonMemberReferralEmail.mockRejectedValue(new Error('smtp'));
    const res = mockRes();
    await controller.create(req(), res);
    expect(res.statusCode).toBe(201);
    expect(res.body.emailSent).toBe(false);
    expect(prismaMock.nonMemberReferral.update).not.toHaveBeenCalled();
  });
});
