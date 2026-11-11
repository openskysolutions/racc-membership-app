/**
 * Non-member referrals (lead-gen): a member refers a lead to a business that is not a
 * chamber member. The business gets one invitation email that never contains lead details.
 * These rows are kept apart from Referral: never in the public feed, points or leaderboard.
 */

import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { businessesCache } from '@/services/contactsCache';
import { refreshDirectoryCache } from '@/services/directoryCache';
import { ghlService } from '@/services/gohighlevel';
import { emailService } from '@/services/emailService';
import { REFERRAL_TEMPERATURES } from '@/services/referralRules';
import {
  NON_MEMBER_DUPLICATE_LEAD_DAYS,
  NON_MEMBER_EMAIL_COOLDOWN_DAYS,
  NonMemberRow,
  cleanLine,
  decideEmailCooldown,
  decideMemberConflict,
  decideNonMemberDuplicate,
  decideNonMemberRateLimit,
  isNonMemberStatus,
  normalizeEmail,
  toNonMemberAdminView,
  toNonMemberGivenView,
} from '@/services/nonMemberReferralRules';
import { isActiveMember } from '@/utils/activeMember';

const DAY = 24 * 60 * 60 * 1000;
const BASE_URL = process.env.FRONTEND_URL || 'https://richfieldareachamber.com';

async function activeMemberSummaries(): Promise<{ name?: string | null; email?: string | null }[]> {
  let all = businessesCache.get() ?? businessesCache.getStale();
  if (!all) {
    try { await refreshDirectoryCache(); } catch { /* fall through */ }
    all = businessesCache.get() ?? businessesCache.getStale() ?? [];
  }
  return all.filter((b: any) => isActiveMember(b)).map((b: any) => ({ name: b.name, email: b.email }));
}

async function referrerName(id: string): Promise<string> {
  const cached = (businessesCache.get() ?? businessesCache.getStale() ?? []).find((b: any) => b.id === id);
  if (cached?.name) return cached.name;
  try {
    return (await ghlService.getBusinessById(id))?.name ?? 'A chamber member';
  } catch {
    return 'A chamber member';
  }
}

export class NonMemberReferralsController {
  /** POST /referrals/non-member */
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const businessId = req.user?.ghlBusinessId;
      if (!businessId) {
        return res.status(403).json({ error: 'Your account must be linked to a member business to give referrals' });
      }
      const userId = parseInt(String(req.user!.id), 10);

      const businessName = cleanLine(req.body?.businessName, 200);
      const email = normalizeEmail(req.body?.email);
      const contactName = cleanLine(req.body?.contactName, 200) || null;
      const phone = cleanLine(req.body?.phone, 50) || null;
      const leadName = cleanLine(req.body?.leadName, 200);
      const leadPhone = cleanLine(req.body?.leadPhone, 50);
      const leadEmailRaw = cleanLine(req.body?.leadEmail, 254);
      const leadEmail = leadEmailRaw ? normalizeEmail(leadEmailRaw) : null;
      const leadBusinessName = cleanLine(req.body?.leadBusinessName, 200) || null;
      const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 2000) || null : null;
      const temperature = cleanLine(req.body?.temperature, 20) || null;

      if (!businessName || !leadName || !leadPhone) {
        return res.status(400).json({ error: 'businessName, leadName and leadPhone are required' });
      }
      if (leadEmailRaw && !leadEmail) return res.status(400).json({ error: 'The lead\'s email address is not valid' });
      if (!email) return res.status(400).json({ error: 'A valid business email address is required' });
      if (temperature && !(REFERRAL_TEMPERATURES as readonly string[]).includes(temperature)) {
        return res.status(400).json({ error: 'temperature must be hot, warm or cold' });
      }

      const now = new Date();
      const [userCount, businessCount, emailed, sameEmail, activeMembers, userWithEmail] = await Promise.all([
        prisma.nonMemberReferral.count({ where: { referrerUserId: userId, createdAt: { gte: new Date(now.getTime() - DAY) } } }),
        prisma.nonMemberReferral.count({ where: { referrerBusinessId: businessId, createdAt: { gte: new Date(now.getTime() - 7 * DAY) } } }),
        prisma.nonMemberReferral.findMany({
          where: { email, emailSentAt: { gte: new Date(now.getTime() - NON_MEMBER_EMAIL_COOLDOWN_DAYS * DAY) } },
          select: { emailSentAt: true },
        }),
        prisma.nonMemberReferral.findMany({
          where: { email, createdAt: { gte: new Date(now.getTime() - NON_MEMBER_DUPLICATE_LEAD_DAYS * DAY) } },
          select: { leadPhone: true, leadEmail: true, createdAt: true },
        }),
        activeMemberSummaries(),
        prisma.user.findFirst({ where: { email, status: 'active' }, select: { id: true } }),
      ]);

      const rejection =
        decideNonMemberRateLimit(userCount, businessCount) ??
        decideMemberConflict({ businessName, email }, activeMembers, !!userWithEmail) ??
        decideEmailCooldown(emailed.map(e => e.emailSentAt), now) ??
        decideNonMemberDuplicate(sameEmail, { phone: leadPhone, email: leadEmail }, now);
      if (rejection) return res.status(rejection.status).json({ error: rejection.message });

      const saved = (await prisma.nonMemberReferral.create({
        data: {
          referrerBusinessId: businessId,
          referrerUserId: userId,
          businessName,
          contactName,
          email,
          phone,
          leadName,
          leadPhone,
          leadEmail,
          leadBusinessName,
          note,
          temperature,
          status: 'sent',
        },
      })) as NonMemberRow;

      let emailSent = false;
      let referral = saved;
      try {
        emailSent = await emailService.sendNonMemberReferralEmail(email, {
          contactName,
          businessName,
          referrerBusinessName: await referrerName(businessId),
          joinUrl: `${BASE_URL}/join`,
        });
        if (emailSent) {
          referral = (await prisma.nonMemberReferral.update({ where: { id: saved.id }, data: { emailSentAt: new Date() } })) as NonMemberRow;
        }
      } catch (err: any) {
        emailSent = false;
        console.error('[referrals] non-member email failed:', err?.message ?? err);
      }

      return res.status(201).json({ referral: toNonMemberGivenView(referral), emailSent });
    } catch (error: any) {
      console.error('createNonMemberReferral error:', error);
      return res.status(500).json({ error: 'Failed to create referral' });
    }
  }

  /** Admin list + stat input. Lead details are never selected into the response. */
  async adminList(): Promise<{ items: ReturnType<typeof toNonMemberAdminView>[]; total: number }> {
    const rows = (await prisma.nonMemberReferral.findMany({ orderBy: { createdAt: 'desc' } })) as NonMemberRow[];
    const names: Record<string, string> = {};
    for (const id of new Set(rows.map(r => r.referrerBusinessId))) names[id] = await referrerName(id);
    return { items: rows.map(r => toNonMemberAdminView(r, names[r.referrerBusinessId])), total: rows.length };
  }

  /** PATCH /admin/referrals/non-member/:id { status?, hiddenByAdmin? } */
  async adminUpdate(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const data: { status?: string; hiddenByAdmin?: boolean } = {};
      if (req.body?.status !== undefined) {
        if (!isNonMemberStatus(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
        data.status = req.body.status;
      }
      if (req.body?.hiddenByAdmin !== undefined) {
        if (typeof req.body.hiddenByAdmin !== 'boolean') return res.status(400).json({ error: 'hiddenByAdmin must be a boolean' });
        data.hiddenByAdmin = req.body.hiddenByAdmin;
      }
      if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nothing to update' });
      const existing = await prisma.nonMemberReferral.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Referral not found' });
      const updated = (await prisma.nonMemberReferral.update({ where: { id }, data })) as NonMemberRow;
      return res.json(toNonMemberAdminView(updated, await referrerName(updated.referrerBusinessId)));
    } catch (error: any) {
      console.error('adminUpdateNonMember error:', error);
      return res.status(500).json({ error: 'Failed to update referral' });
    }
  }
}

export default new NonMemberReferralsController();
