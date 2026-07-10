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
 * Silently removes any tokens that FCM reports as invalid/unregistered.
 */
export async function sendToUsers(
  userIds: number[],
  options: SendNotificationOptions
): Promise<{ sent: number; failed: number }> {
  const tokens = await prisma.deviceToken.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, token: true },
  });

  if (tokens.length === 0) return { sent: 0, failed: 0 };

  return sendToTokens(tokens, options);
}

/**
 * Broadcast a notification to ALL registered device tokens (admin use).
 */
export async function sendToAll(
  options: SendNotificationOptions
): Promise<{ sent: number; failed: number }> {
  const tokens = await prisma.deviceToken.findMany({
    select: { id: true, token: true },
  });

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
      } else {
        failed++;
        const code = r.error?.code;
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
