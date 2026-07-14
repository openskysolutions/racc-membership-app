/**
 * Notification Service - Firebase Cloud Messaging (FCM)
 * Sends push notifications to iOS and Android devices via FCM.
 *
 * Required environment variables:
 *   FCM_PROJECT_ID     - Firebase project ID
 *   FCM_CLIENT_EMAIL   - Firebase service account client email
 *   FCM_PRIVATE_KEY    - Firebase service account private key (newlines as \n)
 */

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { cert } from 'firebase-admin/app';
import { prisma } from '@/lib/prisma';

let app: App | null = null;

function getApp(): App {
  if (app) return app;

  const { FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY } = process.env;

  if (!FCM_PROJECT_ID || !FCM_CLIENT_EMAIL || !FCM_PRIVATE_KEY) {
    throw new Error(
      'Firebase credentials not configured. Set FCM_PROJECT_ID, FCM_CLIENT_EMAIL, and FCM_PRIVATE_KEY.'
    );
  }

  // Reuse existing app if already initialized (e.g. hot reload)
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  app = initializeApp({
    credential: cert({
      projectId: FCM_PROJECT_ID,
      clientEmail: FCM_CLIENT_EMAIL,
      // GitHub Actions stores the key with literal \n — convert to real newlines
      privateKey: FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  return app;
}

export interface SendNotificationOptions {
  title: string;
  body: string;
  /** Deep-link path within the app, e.g. "/events/123" */
  link?: string;
  /** Additional key/value data sent to the app */
  data?: Record<string, string>;
}

/**
 * Send a push notification to every registered device for the given user IDs.
 * Also saves a Notification inbox record for each user.
 */
export async function sendToUsers(
  userIds: number[],
  options: SendNotificationOptions
): Promise<{ sent: number; failed: number }> {
  const tokens = await prisma.deviceToken.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, token: true, userId: true },
  });

  // Save inbox records for every targeted user (regardless of push delivery)
  if (userIds.length > 0) {
    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        title: options.title,
        body: options.body,
        link: options.link ?? null,
      })),
    });
  }

  if (tokens.length === 0) return { sent: 0, failed: 0 };

  return sendToTokens(tokens, options);
}

/**
 * Broadcast a notification to ALL registered device tokens (admin use).
 * Also saves a Notification inbox record for every user.
 */
export async function sendToAll(
  options: SendNotificationOptions
): Promise<{ sent: number; failed: number }> {
  const tokens = await prisma.deviceToken.findMany({
    select: { id: true, token: true, userId: true },
  });

  console.log(`[FCM] sendToAll: found ${tokens.length} device token(s) for ${[...new Set(tokens.map(t => t.userId))].length} user(s)`);
  tokens.forEach(t => console.log(`[FCM]   tokenId=${t.id} userId=${t.userId} token=...${t.token.slice(-8)}`));

  // Save inbox records for all users that have at least one device token
  const uniqueUserIds = [...new Set(tokens.map(t => t.userId))];
  if (uniqueUserIds.length > 0) {
    await prisma.notification.createMany({
      data: uniqueUserIds.map(userId => ({
        userId,
        title: options.title,
        body: options.body,
        link: options.link ?? null,
      })),
    });
  }

  if (tokens.length === 0) return { sent: 0, failed: 0 };

  return sendToTokens(tokens, options);
}

// --- internal helpers ---

async function sendToTokens(
  tokens: { id: number; token: string }[],
  options: SendNotificationOptions
): Promise<{ sent: number; failed: number }> {
  const messaging = getMessaging(getApp());

  const data: Record<string, string> = { ...(options.data ?? {}) };
  if (options.link) data.link = options.link;

  // FCM multicast supports up to 500 tokens per call
  const BATCH_SIZE = 500;
  let sent = 0;
  let failed = 0;
  const staleTokenIds: number[] = [];

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);

    const response = await messaging.sendEachForMulticast({
      tokens: batch.map((t) => t.token),
      notification: { title: options.title, body: options.body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });

    response.responses.forEach((r, idx) => {
      if (r.success) {
        sent++;
        console.log(`[FCM] ✅ Delivered — tokenId=${batch[idx].id} token=...${batch[idx].token.slice(-8)}`);
      } else {
        failed++;
        const code = r.error?.code;
        console.error(`[FCM] ❌ Delivery failed — code: ${code}, message: ${r.error?.message}, tokenId: ${batch[idx].id} token=...${batch[idx].token.slice(-8)}`);
        // Only delete tokens that are definitively invalid on the device side.
        // Do NOT delete on third-party-auth-error — that is a server-side APNs
        // credentials problem and the device token itself is still valid.
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          staleTokenIds.push(batch[idx].id);
        }
      }
    });
  }

  // Prune stale tokens in the background
  if (staleTokenIds.length > 0) {
    prisma.deviceToken
      .deleteMany({ where: { id: { in: staleTokenIds } } })
      .catch(() => {/* best-effort */});
  }

  return { sent, failed };
}
