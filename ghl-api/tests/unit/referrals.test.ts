import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  referral: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), count: vi.fn() },
  referralTestimonial: { findFirst: vi.fn(), create: vi.fn() },
  user: { findMany: vi.fn(), findUnique: vi.fn() },
  nonMemberReferral: { findMany: vi.fn(async () => []) },
}));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
const activeFields = [
  { key: 'membership_tier', valueString: 'basic_membership_package' },
  { key: 'membership_status', valueString: 'active' },
  { key: 'renewal_date', valueString: new Date().toISOString() },
];
const bizDb = vi.hoisted(() => ({ inactive: new Set<string>(['B']), fields: [] as any[] }));
vi.mock('@/services/gohighlevel', () => ({
  ghlService: {
    getBusinessById: vi.fn(async (id: string) => ({
      id, name: `Biz ${id}`, email: id === 'L' ? 'lead@biz.com' : null,
      customFields: bizDb.inactive.has(id) ? [] : bizDb.fields,
    })),
  },
}));
vi.mock('@/services/contactsCache', () => ({ businessesCache: { get: () => null, getStale: () => null }, contactsCache: { getByBusinessId: () => null, getStale: () => null } }));
vi.mock('@/services/emailService', () => ({ emailService: { sendReferralReceivedEmail: vi.fn(), sendReferralStatusUpdateEmail: vi.fn() } }));
vi.mock('@/services/notificationService', () => ({ sendToUsers: vi.fn() }));

import { deriveMemberLead, canActAsRecipient, canTransition, toFeedItem, toAdminView, toParticipantView } from '@/services/referralRules';
import controller from '@/controllers/referralsController';

const row: any = {
  id: 1, referrerBusinessId: 'A', referrerUserId: 7, recipientBusinessId: 'B',
  leadName: 'Secret Lead', leadPhone: '435-555-0100', leadEmail: 'lead@example.com', leadBusinessName: 'Lead Co', note: 'private note',
  temperature: 'hot', status: 'closed_won', hiddenByAdmin: false,
  createdAt: new Date(), updatedAt: new Date(),
  testimonials: [{ id: 1, authorUserId: 9, body: 'Thanks!', createdAt: new Date() }],
};
const names = { A: 'Alpha', B: 'Beta' };

function mockRes() {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (b: any) => { res.body = b; return res; };
  return res;
}

describe('canTransition', () => {
  it('allows forward transitions', () => {
    expect(canTransition('submitted', 'contacted')).toBe(true);
    expect(canTransition('contacted', 'in_discussion')).toBe(true);
    expect(canTransition('in_discussion', 'closed_won')).toBe(true);
  });
  it('blocks backwards, terminal and unknown transitions', () => {
    expect(canTransition('in_discussion', 'contacted')).toBe(false);
    expect(canTransition('closed_won', 'closed_lost')).toBe(false);
    expect(canTransition('not_a_fit', 'contacted')).toBe(false);
    expect(canTransition('submitted', 'submitted')).toBe(false);
    expect(canTransition('submitted', 'bogus')).toBe(false);
  });
});

describe('canActAsRecipient', () => {
  const r = { recipientBusinessId: 'B', recipientUserId: null as number | null };
  it('allows any user of the recipient business when untargeted', () => {
    expect(canActAsRecipient(r, { id: 1, ghlBusinessId: 'B' })).toBe(true);
  });
  it('rejects other businesses and users without a business', () => {
    expect(canActAsRecipient(r, { id: 1, ghlBusinessId: 'A' })).toBe(false);
    expect(canActAsRecipient(r, { id: 1, ghlBusinessId: null })).toBe(false);
    expect(canActAsRecipient({ ...r, recipientUserId: 5 }, { id: 5, role: 'admin', ghlBusinessId: 'A' })).toBe(false);
  });
  it('limits targeted referrals to the person or an admin of that business', () => {
    const t = { ...r, recipientUserId: 5 };
    expect(canActAsRecipient(t, { id: 5, ghlBusinessId: 'B' })).toBe(true);
    expect(canActAsRecipient(t, { id: 6, ghlBusinessId: 'B' })).toBe(false);
    expect(canActAsRecipient(t, { id: 6, role: 'admin', ghlBusinessId: 'B' })).toBe(true);
  });
});

describe('deriveMemberLead', () => {
  it('maps directory phone and email to separate fields', () => {
    expect(deriveMemberLead({ name: 'X', email: 'a@b.com', phone: '1' })).toEqual({ leadName: 'X', leadPhone: '1', leadEmail: 'a@b.com' });
    expect(deriveMemberLead({ name: 'X', phone: '435' })).toEqual({ leadName: 'X', leadPhone: '435', leadEmail: null });
    expect(deriveMemberLead({ name: 'X' })).toEqual({ leadName: 'X', leadPhone: '', leadEmail: null });
  });
});

describe('privacy serializers', () => {
  it('feed item never leaks lead or note data', () => {
    const json = JSON.stringify(toFeedItem(row, names));
    expect(json).not.toContain('Secret Lead');
    expect(json).not.toContain('lead@example.com');
    expect(json).not.toContain('private note');
    expect(json).toContain('Alpha');
    expect(json).toContain('Thanks!');
  });
  it('admin view omits lead details and note', () => {
    const json = JSON.stringify(toAdminView(row, names));
    expect(json).not.toContain('Secret Lead');
    expect(json).not.toContain('lead@example.com');
    expect(json).not.toContain('private note');
  });
  it('participant view includes lead details and direction', () => {
    const v = toParticipantView(row, names, 'B');
    expect(v.leadName).toBe('Secret Lead');
    expect(v.direction).toBe('received');
  });
});

describe('introductions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bizDb.fields = activeFields;
    bizDb.inactive = new Set();
    prismaMock.referral.count.mockResolvedValue(0);
    prismaMock.referral.findMany.mockResolvedValue([]);
    prismaMock.referral.create.mockImplementation(async ({ data }: any) => ({ id: 9, ...data, hiddenByAdmin: false, createdAt: new Date(), updatedAt: new Date() }));
    prismaMock.user.findMany.mockResolvedValue([]);
  });
  const send = (body: any) => {
    const res = mockRes();
    return controller.createReferral({ user: { id: '1', ghlBusinessId: 'A' }, body: { recipientBusinessId: 'B', ...body } } as any, res).then(() => res);
  };

  it('derives lead name/contact server-side and ignores client-supplied values', async () => {
    const res = await send({ leadBusinessId: 'L', leadName: 'Hacker', leadPhone: '000', leadEmail: 'evil@x.com', leadBusinessName: 'Evil' });
    expect(res.statusCode).toBe(201);
    const data = prismaMock.referral.create.mock.calls[0][0].data;
    expect(data.leadBusinessId).toBe('L');
    expect(data.leadName).toBe('Biz L');
    expect(data.leadEmail).toBe('lead@biz.com');
    expect(data.leadBusinessName).toBeNull();
  });
  it('does not require leadName/leadPhone in introduction mode', async () => {
    expect((await send({ leadBusinessId: 'L' })).statusCode).toBe(201);
  });
  it('400 when introducing own business, the recipient, or a non-active member', async () => {
    expect((await send({ leadBusinessId: 'A' })).statusCode).toBe(400);
    expect((await send({ leadBusinessId: 'B' })).statusCode).toBe(400);
    bizDb.inactive = new Set(['L']);
    expect((await send({ leadBusinessId: 'L' })).statusCode).toBe(400);
    expect(prismaMock.referral.create).not.toHaveBeenCalled();
  });
  it('409 on duplicate introduction of the same member', async () => {
    prismaMock.referral.findMany.mockResolvedValue([{ leadPhone: '', leadBusinessId: 'L', status: 'contacted', createdAt: new Date() }]);
    expect((await send({ leadBusinessId: 'L' })).statusCode).toBe(409);
  });
  it('feed and admin views do not reveal the introduced member', () => {
    const intro = { ...row, leadBusinessId: 'L', leadName: 'Biz L', leadPhone: '435', leadEmail: 'lead@biz.com' };
    for (const v of [toFeedItem(intro, names), toAdminView(intro, names)]) {
      const json = JSON.stringify(v);
      expect(json).not.toContain('Biz L');
      expect(json).not.toContain('lead@biz.com');
      expect(json).not.toContain('"L"');
    }
    expect((toAdminView(intro, names) as any).introduction).toBe(true);
    const pv: any = toParticipantView(intro, names, 'A');
    expect(pv.leadIsMember).toBe(true);
    expect(pv.leadBusinessId).toBe('L');
  });
});

describe('controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bizDb.inactive = new Set(['B']);
  });

  it('wrong person on a targeted referral gets 404 for status and testimonial', async () => {
    prismaMock.referral.findUnique.mockResolvedValue({ ...row, status: 'closed_won', recipientUserId: 5 });
    const user = { id: '6', ghlBusinessId: 'B' };
    const r1 = mockRes();
    await controller.updateReferralStatus({ params: { id: '1' }, body: { status: 'contacted' }, user } as any, r1);
    const r2 = mockRes();
    await controller.addTestimonial({ params: { id: '1' }, body: { body: 'hi' }, user } as any, r2);
    expect(r1.statusCode).toBe(404);
    expect(r2.statusCode).toBe(404);
  });

  it('rejects a recipient business that is not an active member', async () => {
    const res = mockRes();
    await controller.createReferral(
      { user: { id: '1', ghlBusinessId: 'A' }, body: { recipientBusinessId: 'B', leadName: 'x', leadPhone: 'y' } } as any, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("isn't a member");
    expect(prismaMock.referral.create).not.toHaveBeenCalled();
  });

  it('rejects a recipientUserId from a different business', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 5, status: 'active', ghlBusinessId: 'OTHER' });
    const res = mockRes();
    await controller.createReferral(
      { user: { id: '1', ghlBusinessId: 'A' }, body: { recipientBusinessId: 'B', recipientUserId: 5, leadName: 'x', leadPhone: 'y' } } as any, res);
    expect(res.statusCode).toBe(400);
    expect(prismaMock.referral.create).not.toHaveBeenCalled();
  });

  it('rejects an inactive recipient user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 5, status: 'suspended', ghlBusinessId: 'B' });
    const res = mockRes();
    await controller.createReferral(
      { user: { id: '1', ghlBusinessId: 'A' }, body: { recipientBusinessId: 'B', recipientUserId: 5, leadName: 'x', leadPhone: 'y' } } as any, res);
    expect(res.statusCode).toBe(400);
  });

  it('received list excludes referrals targeted at others', async () => {
    prismaMock.referral.findMany.mockResolvedValue([]);
    await controller.getMyReferrals({ query: { direction: 'received' }, user: { id: '6', role: 'member', ghlBusinessId: 'B' } } as any, mockRes());
    expect(prismaMock.referral.findMany.mock.calls[0][0].where).toEqual({
      recipientBusinessId: 'B', OR: [{ recipientUserId: null }, { recipientUserId: 6 }],
    });
  });


  it('public feed filters hidden rows and returns no lead fields', async () => {
    prismaMock.referral.findMany.mockResolvedValue([row]);
    const res = mockRes();
    await controller.getPublicFeed({ query: {} } as any, res);
    expect(prismaMock.referral.findMany.mock.calls[0][0].where).toEqual({ hiddenByAdmin: false });
    expect(JSON.stringify(res.body)).not.toContain('Secret Lead');
  });

  it('rejects referring own business', async () => {
    const res = mockRes();
    await controller.createReferral(
      { user: { id: '1', ghlBusinessId: 'A' }, body: { recipientBusinessId: 'A', leadName: 'x', leadPhone: 'y' } } as any, res);
    expect(res.statusCode).toBe(400);
    expect(prismaMock.referral.create).not.toHaveBeenCalled();
  });

  it('only recipient business can update status', async () => {
    prismaMock.referral.findUnique.mockResolvedValue({ ...row, status: 'submitted' });
    const res = mockRes();
    await controller.updateReferralStatus(
      { params: { id: '1' }, body: { status: 'contacted' }, user: { id: '1', ghlBusinessId: 'A' } } as any, res);
    expect(res.statusCode).toBe(404);
    expect(prismaMock.referral.update).not.toHaveBeenCalled();
  });

  it('testimonial requires closed_won', async () => {
    prismaMock.referral.findUnique.mockResolvedValue({ ...row, status: 'contacted' });
    const res = mockRes();
    await controller.addTestimonial(
      { params: { id: '1' }, body: { body: 'thanks' }, user: { id: '1', ghlBusinessId: 'B' } } as any, res);
    expect(res.statusCode).toBe(400);
    expect(prismaMock.referralTestimonial.create).not.toHaveBeenCalled();
  });
});

import { decideDuplicate } from '@/services/referralLimits';
describe('decideDuplicate with leadBusinessId', () => {
  const now = new Date('2026-06-01');
  it('flags same member within 30 days or while open, regardless of contact', () => {
    const e = (o: any) => [{ leadPhone: 'other', leadBusinessId: 'L', status: 'closed_lost', createdAt: new Date('2026-05-20'), ...o }];
    expect(decideDuplicate(e({}), { phone: '999' }, now, 'L')?.status).toBe(409);
    expect(decideDuplicate(e({ createdAt: new Date('2026-01-01'), status: 'contacted' }), { phone: '999' }, now, 'L')?.status).toBe(409);
    expect(decideDuplicate(e({ createdAt: new Date('2026-01-01') }), { phone: '999' }, now, 'L')).toBeNull();
    expect(decideDuplicate(e({ leadBusinessId: 'M' }), { phone: '999' }, now, 'L')).toBeNull();
  });
});
