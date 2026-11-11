/**
 * Digital Business Card Routes
 *
 * GET  /api/cards/me                 – current user's card settings + share token (auth required, created on first call)
 * PUT  /api/cards/me                 – update which fields are shown / turn the card off (auth required)
 * GET  /api/cards/:publicId          – public card data (only the fields the member chose to share)
 * GET  /api/cards/:publicId/vcard    – public .vcf download for "Save contact"
 */

import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/middleware/auth';
import { databaseService } from '@/services/database';
import { enrichUserWithGhlData } from '@/services/userEnrichment';
import { ghlService } from '@/services/gohighlevel';
import { businessesCache } from '@/services/contactsCache';
import { buildVCard, vCardFilename } from '@/lib/vcard';

const router = express.Router();

const PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const CARD_CACHE_TTL_MS = 5 * 60 * 1000;

interface PublicCard {
  firstName: string;
  lastName: string;
  name: string;
  businessName?: string;
  logoUrl?: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
}

const cardCache = new Map<string, { card: PublicCard; expires: number }>();

function newPublicId(): string {
  return randomBytes(9).toString('base64url'); // 12 URL-safe chars, ~72 bits
}

/** Ensures the user has a card row, retrying once if a concurrent request created it first. */
async function getOrCreateCard(userId: number) {
  const existing = await prisma.memberCard.findUnique({ where: { userId } });
  if (existing) return existing;
  try {
    return await prisma.memberCard.create({ data: { userId, publicId: newPublicId() } });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      const raced = await prisma.memberCard.findUnique({ where: { userId } });
      if (raced) return raced;
    }
    throw err;
  }
}

/** The business logo (GHL business custom property `logo_url`); uses the directory cache when warm. */
async function loadBusinessLogo(businessId?: string | null): Promise<string | undefined> {
  if (!businessId) return undefined;
  try {
    const cached = (businessesCache.get() ?? businessesCache.getStale())?.find((b: any) => b.id === businessId);
    const business = cached ?? (await ghlService.getBusinessById(businessId));
    const field = (business?.customFields ?? []).find((f: any) => f.key === 'logo_url');
    return field?.valueString || undefined;
  } catch (err) {
    console.error('[cards] could not load business logo:', err);
    return undefined;
  }
}

/** Builds the public view of a card from GHL data, honoring the member's visibility choices. */
async function loadPublicCard(card: {
  userId: number;
  showPhone: boolean;
  showEmail: boolean;
  showWebsite: boolean;
}): Promise<PublicCard | null> {
  const dbUser = await databaseService.findUserById(card.userId);
  if (!dbUser || dbUser.status !== 'active') return null;

  const enriched = await enrichUserWithGhlData(dbUser as any);
  const firstName = enriched.firstName || '';
  const lastName = enriched.lastName || '';
  const name = `${firstName} ${lastName}`.trim();
  if (!name) return null;

  return {
    firstName,
    lastName,
    name,
    businessName: enriched.businessName || undefined,
    logoUrl: await loadBusinessLogo(enriched.ghlBusinessId),
    avatarUrl: enriched.avatarUrl,
    phone: card.showPhone ? enriched.phone || undefined : undefined,
    email: card.showEmail ? enriched.email || undefined : undefined,
    website: card.showWebsite ? enriched.website || undefined : undefined,
  };
}

async function resolvePublicCard(publicId: string): Promise<PublicCard | null> {
  if (!PUBLIC_ID_PATTERN.test(publicId)) return null;

  const cached = cardCache.get(publicId);
  if (cached && cached.expires > Date.now()) return cached.card;

  const card = await prisma.memberCard.findUnique({ where: { publicId } });
  if (!card || !card.enabled) return null;

  const publicCard = await loadPublicCard(card);
  if (publicCard) cardCache.set(publicId, { card: publicCard, expires: Date.now() + CARD_CACHE_TTL_MS });
  return publicCard;
}

function settingsResponse(card: {
  publicId: string;
  enabled: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showWebsite: boolean;
}) {
  return {
    publicId: card.publicId,
    enabled: card.enabled,
    showPhone: card.showPhone,
    showEmail: card.showEmail,
    showWebsite: card.showWebsite,
  };
}

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const card = await getOrCreateCard(Number(req.user!.id));
    const preview = await loadPublicCard(card);
    res.json({ ...settingsResponse(card), preview });
  } catch (error) {
    console.error('[GET /cards/me] failed:', error);
    res.status(500).json({ error: 'Failed to load your card' });
  }
});

router.put('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { enabled, showPhone, showEmail, showWebsite } = req.body ?? {};
    const data: Record<string, boolean> = {};
    for (const [key, value] of Object.entries({ enabled, showPhone, showEmail, showWebsite })) {
      if (value === undefined) continue;
      if (typeof value !== 'boolean') {
        return res.status(400).json({ error: `${key} must be true or false` });
      }
      data[key] = value;
    }

    const existing = await getOrCreateCard(Number(req.user!.id));
    const card = await prisma.memberCard.update({ where: { id: existing.id }, data });
    cardCache.delete(card.publicId);
    const preview = await loadPublicCard(card);
    res.json({ ...settingsResponse(card), preview });
  } catch (error) {
    console.error('[PUT /cards/me] failed:', error);
    res.status(500).json({ error: 'Failed to update your card' });
  }
});

router.get('/:publicId/vcard', async (req: Request, res: Response) => {
  try {
    const card = await resolvePublicCard(req.params.publicId);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const input = {
      firstName: card.firstName,
      lastName: card.lastName,
      organization: card.businessName,
      phone: card.phone,
      email: card.email,
      website: card.website,
    };
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${vCardFilename(input)}"`);
    res.send(buildVCard(input));
  } catch (error) {
    console.error('[GET /cards/:publicId/vcard] failed:', error);
    res.status(500).json({ error: 'Failed to build contact file' });
  }
});

router.get('/:publicId', async (req: Request, res: Response) => {
  try {
    const card = await resolvePublicCard(req.params.publicId);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json(card);
  } catch (error) {
    console.error('[GET /cards/:publicId] failed:', error);
    res.status(500).json({ error: 'Failed to load card' });
  }
});

export default router;
