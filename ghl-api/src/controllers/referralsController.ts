/**
 * Referrals Controller
 * Member-to-member referrals ("Member Connect"). Lead name/contact are only ever
 * returned to the referrer and recipient businesses.
 */

import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { ghlService } from '@/services/gohighlevel';
import { businessesCache, contactsCache } from '@/services/contactsCache';
import { emailService } from '@/services/emailService';
import { sendToUsers } from '@/services/notificationService';
import {
  REFERRAL_TEMPERATURES,
  BusinessNames,
  ReferralRow,
  canActAsRecipient,
  deriveMemberLead,
  canTransition,
  isReferralStatus,
  toAdminView,
  toFeedItem,
  toParticipantView,
} from '@/services/referralRules';
import nonMemberController from '@/controllers/nonMemberReferralsController';
import { NonMemberRow, normalizeEmail, toNonMemberGivenView } from '@/services/nonMemberReferralRules';
import { isActiveMember } from '@/utils/activeMember';
import { computeScores, monthWindow, recomputePoints, tierForPoints } from '@/services/referralPointsService';
import { DUPLICATE_WINDOW_DAYS, OPEN_STATUSES, decideDuplicate, decideRateLimit } from '@/services/referralLimits';

const APP_URL = `${process.env.FRONTEND_URL || 'https://richfieldareachamber.com'}/referrals`;

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  contacted: 'Contacted',
  in_discussion: 'In Discussion',
  closed_won: 'Closed - Won',
  closed_lost: 'Closed - Lost',
  not_a_fit: 'Not a Fit',
};

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

async function resolveBusinessNames(ids: string[]): Promise<BusinessNames> {
  const unique = [...new Set(ids)];
  const names: BusinessNames = {};
  const cached = businessesCache.get() ?? businessesCache.getStale() ?? [];
  const missing: string[] = [];
  for (const id of unique) {
    const hit = cached.find((b: any) => b.id === id);
    if (hit?.name) names[id] = hit.name;
    else missing.push(id);
  }
  await Promise.all(
    missing.map(async id => {
      try {
        const b = await ghlService.getBusinessById(id);
        if (b?.name) names[id] = b.name;
      } catch {
        /* leave unresolved */
      }
    })
  );
  return names;
}

async function findBusiness(id: string): Promise<any | null> {
  const hit = (businessesCache.get() ?? businessesCache.getStale() ?? []).find((b: any) => b.id === id);
  if (hit) return hit;
  try {
    return await ghlService.getBusinessById(id);
  } catch {
    return null;
  }
}

async function namesFor(rows: ReferralRow[]): Promise<BusinessNames> {
  return resolveBusinessNames(rows.flatMap(r => [r.referrerBusinessId, r.recipientBusinessId]));
}

/** Display names for app users, using the contacts cache (one GHL call per uncached business). */
async function resolveUserNames(users: { id: number; email: string; ghlContactId: string | null; ghlBusinessId: string | null }[]): Promise<Record<number, string>> {
  const byBiz = new Map<string, any[]>();
  for (const bizId of new Set(users.map(u => u.ghlBusinessId).filter((x): x is string => !!x))) {
    let contacts = contactsCache.getByBusinessId(bizId) ?? contactsCache.getStale()?.filter((c: any) => c.businessId === bizId) ?? null;
    if (!contacts || contacts.length === 0) {
      contacts = await ghlService.getContactsByBusinessId(bizId).catch(() => []);
    }
    byBiz.set(bizId, contacts ?? []);
  }
  const out: Record<number, string> = {};
  for (const u of users) {
    const c = (byBiz.get(u.ghlBusinessId ?? '') ?? []).find((x: any) => x.id === u.ghlContactId);
    const full = c ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() : '';
    out[u.id] = full || u.email.split('@')[0];
  }
  return out;
}

async function recipientNameFor(rows: ReferralRow[]): Promise<Record<number, string>> {
  const ids = [...new Set(rows.map(r => r.recipientUserId).filter((x): x is number => x != null))];
  if (ids.length === 0) return {};
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true, ghlContactId: true, ghlBusinessId: true },
  });
  return resolveUserNames(users);
}

function actor(req: Request) {
  return { id: parseInt(String(req.user!.id), 10), role: req.user!.role, ghlBusinessId: req.user!.ghlBusinessId };
}

/** Fire-and-forget: notification failures must never fail the request. */
function safely(label: string, p: Promise<unknown>) {
  p.catch(err => console.error(`[referrals] ${label} failed:`, err?.message ?? err));
}

export class ReferralsController {
  private userId(req: Request): number {
    return parseInt(String(req.user!.id), 10);
  }

  /** Points are a cache of derived data; a failed refresh must not fail the request. */
  private async refreshPoints(...businessIds: string[]) {
    try {
      await recomputePoints(businessIds);
    } catch (err: any) {
      console.error('[referrals] points recompute failed:', err?.message ?? err);
    }
  }

  /** GET /referrals/leaderboard?period=month|all (public) */
  async getLeaderboard(req: Request, res: Response): Promise<Response> {
    try {
      const period = req.query.period === 'month' ? 'month' : 'all';
      const rows = await prisma.referral.findMany({
        where: { hiddenByAdmin: false },
        include: { testimonials: { select: { createdAt: true } } },
      });
      const allTime = computeScores(rows as any);
      const scores = [...(period === 'month' ? computeScores(rows as any, monthWindow()) : allTime).values()]
        .filter(s => s.points > 0)
        .sort((a, b) => b.points - a.points || b.closedWon - a.closedWon)
        .slice(0, 50);
      const names = await resolveBusinessNames(scores.map(s => s.businessId));
      return res.json({
        period,
        entries: scores.map((s, i) => ({
          rank: i + 1,
          businessId: s.businessId,
          businessName: names[s.businessId] ?? 'Unknown business',
          points: s.points,
          tier: tierForPoints(allTime.get(s.businessId)?.points ?? 0),
          referralsGiven: s.given,
          closedWon: s.closedWon,
          testimonials: s.testimonials,
        })),
      });
    } catch (error: any) {
      console.error('getLeaderboard error:', error);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  }

  /** POST /referrals */
  async createReferral(req: Request, res: Response): Promise<Response> {
    try {
      const businessId = req.user?.ghlBusinessId;
      if (!businessId) {
        return res.status(403).json({ error: 'Your account must be linked to a member business to give referrals' });
      }

      const recipientBusinessId = str(req.body?.recipientBusinessId, 100);
      const leadBusinessId = str(req.body?.leadBusinessId, 100) || null;
      let leadName = leadBusinessId ? '' : str(req.body?.leadName, 200);
      let leadPhone = leadBusinessId ? '' : str(req.body?.leadPhone, 50);
      let leadEmail: string | null = null;
      if (!leadBusinessId && str(req.body?.leadEmail, 254)) {
        leadEmail = normalizeEmail(req.body.leadEmail);
        if (!leadEmail) return res.status(400).json({ error: 'The lead\'s email address is not valid' });
      }
      const leadBusinessName = leadBusinessId ? null : str(req.body?.leadBusinessName, 200) || null;
      const note = str(req.body?.note, 2000) || null;
      const temperature = str(req.body?.temperature, 20) || null;

      if (!recipientBusinessId || (!leadBusinessId && (!leadName || !leadPhone))) {
        return res.status(400).json({ error: 'recipientBusinessId, leadName and leadPhone are required' });
      }
      if (temperature && !(REFERRAL_TEMPERATURES as readonly string[]).includes(temperature)) {
        return res.status(400).json({ error: 'temperature must be hot, warm or cold' });
      }
      if (recipientBusinessId === businessId) {
        return res.status(400).json({ error: 'You cannot refer a lead to your own business' });
      }

      let recipientUserId: number | null = null;
      if (req.body?.recipientUserId != null && req.body.recipientUserId !== '') {
        const rid = Number(req.body.recipientUserId);
        if (!Number.isInteger(rid) || rid <= 0) {
          return res.status(400).json({ error: 'Invalid recipientUserId' });
        }
        const target = await prisma.user.findUnique({ where: { id: rid }, select: { id: true, status: true, ghlBusinessId: true } });
        if (!target || target.status !== 'active' || target.ghlBusinessId !== recipientBusinessId) {
          return res.status(400).json({ error: 'That person is not an active member of the recipient business' });
        }
        recipientUserId = rid;
      }

      const names = await resolveBusinessNames([recipientBusinessId, businessId]);
      if (!names[recipientBusinessId]) {
        return res.status(404).json({ error: 'Recipient business not found' });
      }
      if (!isActiveMember(await findBusiness(recipientBusinessId))) {
        return res.status(400).json({
          error: 'That business is not an active chamber member. Use "Refer a business that isn\'t a member" instead.',
        });
      }

      if (leadBusinessId) {
        if (leadBusinessId === businessId) {
          return res.status(400).json({ error: 'You cannot introduce your own business' });
        }
        if (leadBusinessId === recipientBusinessId) {
          return res.status(400).json({ error: 'You cannot introduce a business to itself' });
        }
        const leadBiz = await findBusiness(leadBusinessId);
        if (!leadBiz || !isActiveMember(leadBiz)) {
          return res.status(400).json({ error: 'The member you want to introduce was not found or is not an active chamber member' });
        }
        ({ leadName, leadPhone, leadEmail } = deriveMemberLead(leadBiz));
        leadName = leadName.slice(0, 200);
        leadPhone = leadPhone.slice(0, 50);
        leadEmail = leadEmail ? leadEmail.slice(0, 254) : null;
      }

      const DAY = 24 * 60 * 60 * 1000;
      const now = Date.now();
      const [userCount, businessCount, existing] = await Promise.all([
        prisma.referral.count({ where: { referrerUserId: this.userId(req), createdAt: { gte: new Date(now - DAY) } } }),
        prisma.referral.count({ where: { referrerBusinessId: businessId, createdAt: { gte: new Date(now - 7 * DAY) } } }),
        prisma.referral.findMany({
          where: {
            referrerBusinessId: businessId,
            recipientBusinessId,
            OR: [{ createdAt: { gte: new Date(now - DUPLICATE_WINDOW_DAYS * DAY) } }, { status: { in: OPEN_STATUSES } }],
          },
          select: { leadPhone: true, leadEmail: true, leadBusinessId: true, status: true, createdAt: true },
        }),
      ]);
      const rejection = decideRateLimit(userCount, businessCount) ?? decideDuplicate(existing, { phone: leadPhone, email: leadEmail }, new Date(), leadBusinessId);
      if (rejection) return res.status(rejection.status).json({ error: rejection.message });

      const referral = await prisma.referral.create({
        data: {
          referrerBusinessId: businessId,
          referrerUserId: this.userId(req),
          recipientBusinessId,
          recipientUserId,
          leadBusinessId,
          leadName,
          leadPhone,
          leadEmail,
          leadBusinessName,
          note,
          temperature,
          status: 'submitted',
        },
      });

      safely('notify recipient', this.notifyReceived(referral, names));

      const unames = await recipientNameFor([referral as ReferralRow]);
      return res.status(201).json(toParticipantView(referral as ReferralRow, names, businessId, referral.recipientUserId != null ? unames[referral.recipientUserId] : null));
    } catch (error: any) {
      console.error('createReferral error:', error);
      return res.status(500).json({ error: 'Failed to create referral' });
    }
  }

  private async notifyReceived(r: ReferralRow, names: BusinessNames) {
    const users = await prisma.user.findMany({
      where: r.recipientUserId != null
        ? { id: r.recipientUserId, status: 'active' }
        : { ghlBusinessId: r.recipientBusinessId, status: 'active' },
      select: { id: true, email: true },
    });
    if (users.length === 0) return;
    const referrerName = names[r.referrerBusinessId] ?? 'A fellow member';
    await sendToUsers(users.map(u => u.id), {
      title: 'New referral received',
      body: `${referrerName} referred ${r.leadName} to your business.`,
      link: '/referrals',
    });
    await Promise.all(
      users.map(u =>
        emailService.sendReferralReceivedEmail(u.email, {
          referrerBusinessName: referrerName,
          leadName: r.leadName,
          appUrl: APP_URL,
        })
      )
    );
  }

  private async notifyStatus(r: ReferralRow, names: BusinessNames) {
    const referrer = await prisma.user.findUnique({
      where: { id: r.referrerUserId },
      select: { id: true, email: true },
    });
    if (!referrer) return;
    const recipientName = names[r.recipientBusinessId] ?? 'The recipient';
    const statusLabel = STATUS_LABELS[r.status] ?? r.status;
    await sendToUsers([referrer.id], {
      title: 'Referral update',
      body: `${recipientName} marked your referral of ${r.leadName} as ${statusLabel}.`,
      link: '/referrals',
    });
    await emailService.sendReferralStatusUpdateEmail(referrer.email, {
      recipientBusinessName: recipientName,
      leadName: r.leadName,
      statusLabel,
      appUrl: APP_URL,
    });
  }

  /** GET /referrals/mine?direction=given|received */
  async getMyReferrals(req: Request, res: Response): Promise<Response> {
    try {
      const businessId = req.user?.ghlBusinessId;
      if (!businessId) return res.json({ referrals: [] });

      const me = actor(req);
      const direction = req.query.direction;
      const given = { referrerBusinessId: businessId };
      const received: any =
        me.role === 'admin'
          ? { recipientBusinessId: businessId }
          : { recipientBusinessId: businessId, OR: [{ recipientUserId: null }, { recipientUserId: me.id }] };
      const where = direction === 'given' ? given : direction === 'received' ? received : { OR: [given, received] };

      const rows = (await prisma.referral.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { testimonials: { orderBy: { createdAt: 'asc' } } },
      })) as ReferralRow[];

      const [names, unames] = await Promise.all([namesFor(rows), recipientNameFor(rows)]);
      const nonMember = direction === 'received'
        ? []
        : ((await prisma.nonMemberReferral.findMany({
            where: { referrerBusinessId: businessId },
            orderBy: { createdAt: 'desc' },
          })) as NonMemberRow[]).map(toNonMemberGivenView);
      return res.json({
        referrals: rows.map(r => toParticipantView(r, names, businessId, r.recipientUserId != null ? unames[r.recipientUserId] : null)),
        nonMemberReferrals: nonMember,
      });
    } catch (error: any) {
      console.error('getMyReferrals error:', error);
      return res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  }

  /** PATCH /referrals/:id/status (recipient business only) */
  async updateReferralStatus(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      const status = req.body?.status;
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid referral id' });
      if (!isReferralStatus(status)) return res.status(400).json({ error: 'Invalid status' });

      const businessId = req.user?.ghlBusinessId;
      const existing = await prisma.referral.findUnique({ where: { id } });
      if (!existing || !canActAsRecipient(existing, actor(req))) {
        return res.status(404).json({ error: 'Referral not found' });
      }
      if (!canTransition(existing.status, status)) {
        return res.status(400).json({ error: `Cannot change status from ${existing.status} to ${status}` });
      }

      const updated = await prisma.referral.update({
        where: { id },
        data: { status },
        include: { testimonials: true },
      });
      await this.refreshPoints(updated.referrerBusinessId, updated.recipientBusinessId);
      const [names, unames] = await Promise.all([namesFor([updated as ReferralRow]), recipientNameFor([updated as ReferralRow])]);
      safely('notify referrer', this.notifyStatus(updated as ReferralRow, names));

      return res.json(toParticipantView(updated as ReferralRow, names, businessId!, updated.recipientUserId != null ? unames[updated.recipientUserId] : null));
    } catch (error: any) {
      console.error('updateReferralStatus error:', error);
      return res.status(500).json({ error: 'Failed to update referral status' });
    }
  }

  /** POST /referrals/:id/testimonial (recipient business, closed_won only) */
  async addTestimonial(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      const body = str(req.body?.body, 1000);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid referral id' });
      if (!body) return res.status(400).json({ error: 'Testimonial text is required' });

      const businessId = req.user?.ghlBusinessId;
      const existing = await prisma.referral.findUnique({ where: { id } });
      if (!existing || !canActAsRecipient(existing, actor(req))) {
        return res.status(404).json({ error: 'Referral not found' });
      }
      if (existing.status !== 'closed_won') {
        return res.status(400).json({ error: 'A thank-you can only be posted once the referral is closed - won' });
      }
      const already = await prisma.referralTestimonial.findFirst({ where: { referralId: id } });
      if (already) return res.status(409).json({ error: 'A thank-you has already been posted for this referral' });

      const testimonial = await prisma.referralTestimonial.create({
        data: { referralId: id, authorUserId: this.userId(req), body },
      });
      await this.refreshPoints(existing.referrerBusinessId, existing.recipientBusinessId);
      return res.status(201).json({ id: testimonial.id, body: testimonial.body, createdAt: testimonial.createdAt });
    } catch (error: any) {
      console.error('addTestimonial error:', error);
      return res.status(500).json({ error: 'Failed to add testimonial' });
    }
  }

  createNonMember(req: Request, res: Response) {
    return nonMemberController.create(req, res);
  }

  adminUpdateNonMember(req: Request, res: Response) {
    return nonMemberController.adminUpdate(req, res);
  }

  /** GET /referrals/recipients/:businessId - active app users at a business (id + name only) */
  async getRecipients(req: Request, res: Response): Promise<Response> {
    try {
      const users = await prisma.user.findMany({
        where: { ghlBusinessId: req.params.businessId, status: 'active' },
        select: { id: true, email: true, ghlContactId: true, ghlBusinessId: true },
      });
      const names = await resolveUserNames(users);
      return res.json({
        recipients: users.map(u => ({ id: u.id, name: names[u.id] })).sort((a, b) => a.name.localeCompare(b.name)),
      });
    } catch (error: any) {
      console.error('getRecipients error:', error);
      return res.status(500).json({ error: 'Failed to fetch recipients' });
    }
  }

  /** GET /referrals/feed (public) */
  async getPublicFeed(req: Request, res: Response): Promise<Response> {
    try {
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 100);
      const rows = (await prisma.referral.findMany({
        where: { hiddenByAdmin: false },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { testimonials: { orderBy: { createdAt: 'asc' } } },
      })) as ReferralRow[];
      const names = await namesFor(rows);
      return res.json({ items: rows.map(r => toFeedItem(r, names)) });
    } catch (error: any) {
      console.error('getPublicFeed error:', error);
      return res.status(500).json({ error: 'Failed to fetch referral feed' });
    }
  }

  /** GET /admin/referrals?status=&hidden=true|false&search= */
  async getAdminReferrals(req: Request, res: Response): Promise<Response> {
    try {
      const { status, hidden } = req.query as Record<string, string>;
      const where: any = {};
      if (status) {
        if (!isReferralStatus(status)) return res.status(400).json({ error: 'Invalid status' });
        where.status = status;
      }
      if (hidden === 'true') where.hiddenByAdmin = true;
      if (hidden === 'false') where.hiddenByAdmin = false;

      const rows = (await prisma.referral.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { testimonials: true },
      })) as ReferralRow[];
      const names = await namesFor(rows);
      const referrals = rows.map(r => toAdminView(r, names));

      const counts = new Map<string, number>();
      for (const r of rows) counts.set(r.referrerBusinessId, (counts.get(r.referrerBusinessId) ?? 0) + 1);
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

      const nm = await nonMemberController.adminList();
      return res.json({
        referrals,
        nonMemberReferrals: nm.items,
        stats: {
          nonMemberTotal: nm.total,
          total: rows.length,
          closedWon: rows.filter(r => r.status === 'closed_won').length,
          hidden: rows.filter(r => r.hiddenByAdmin).length,
          topConnector: top ? { businessId: top[0], name: names[top[0]] ?? 'Unknown business', count: top[1] } : null,
        },
      });
    } catch (error: any) {
      console.error('getAdminReferrals error:', error);
      return res.status(500).json({ error: 'Failed to fetch referrals' });
    }
  }

  /** PATCH /admin/referrals/:id  { hiddenByAdmin?: boolean, status?: string } */
  async adminModerateReferral(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid referral id' });

      const data: { hiddenByAdmin?: boolean; status?: string } = {};
      if (req.body?.hiddenByAdmin !== undefined) {
        if (typeof req.body.hiddenByAdmin !== 'boolean') return res.status(400).json({ error: 'hiddenByAdmin must be a boolean' });
        data.hiddenByAdmin = req.body.hiddenByAdmin;
      }
      if (req.body?.status !== undefined) {
        if (!isReferralStatus(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
        data.status = req.body.status;
      }
      if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nothing to update' });

      const existing = await prisma.referral.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Referral not found' });

      const updated = (await prisma.referral.update({
        where: { id },
        data,
        include: { testimonials: true },
      })) as ReferralRow;
      await this.refreshPoints(updated.referrerBusinessId, updated.recipientBusinessId);
      const names = await namesFor([updated]);
      return res.json(toAdminView(updated, names));
    } catch (error: any) {
      console.error('adminModerateReferral error:', error);
      return res.status(500).json({ error: 'Failed to moderate referral' });
    }
  }
}

export default new ReferralsController();
