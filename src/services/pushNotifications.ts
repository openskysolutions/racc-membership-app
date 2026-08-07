/**
 * Push Notification Service
 * Registers device tokens with the backend using @capacitor/push-notifications.
 * Only runs on native iOS/Android builds — silently no-ops on web.
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { apiFetch } from './apiClient';

// Fired when the user taps a notification — the app can handle navigation here.
export type NotificationTapHandler = (notification: ActionPerformed) => void;

let tapHandler: NotificationTapHandler | null = null;

/**
 * When the app is launched cold (killed state) by tapping a notification,
 * the Capacitor event can fire before the React app has registered the tap handler.
 * We store the link here so App.tsx can pick it up on mount.
 */
let pendingDeepLink: string | null = null;

export function consumePendingDeepLink(): string | null {
  const link = pendingDeepLink;
  pendingDeepLink = null;
  return link;
}

/**
 * Set a callback that fires when the user taps a push notification.
 * The `notification.notification.data.link` field will contain a route path
 * like "/events/123" that the app can navigate to.
 */
export function onNotificationTap(handler: NotificationTapHandler) {
  tapHandler = handler;
}

// Register the tap listener at module load time on native platforms.
// This captures cold-start notification taps that arrive before the user
// has authenticated and initPushNotifications() has been called.
function handleTapAction(action: ActionPerformed) {
  const link = action.notification?.data?.link as string | undefined;
  if (link) pendingDeepLink = link;
  if (tapHandler) tapHandler(action);
}

if (Capacitor.isNativePlatform()) {
  PushNotifications.addListener('pushNotificationActionPerformed', handleTapAction);
}

/**
 * Initialize push notifications for the current session.
 * Call this once after the user has authenticated.
 */
export async function initPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // Request / check permission
  // Wrapped in try-catch: on Android, requestPermissions() can throw a native
  // exception (e.g. if Firebase is not fully initialized yet).
  let permStatus: { receive: string };
  try {
    permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
  } catch (err) {
    console.warn('[Push] Permission check/request failed (Android):', err);
    return;
  }

  if (permStatus.receive !== 'granted') {
    console.log('[Push] Permission not granted:', permStatus.receive);
    return;
  }

  // Register with APNs / FCM — fires Token event on success

  // Remove previous listeners to avoid duplicates on re-login,
  // then immediately re-add the tap listener so no cold-start events are missed
  // during the re-registration window.
  await PushNotifications.removeAllListeners();
  PushNotifications.addListener('pushNotificationActionPerformed', handleTapAction);

  // Token received → send to our backend
  PushNotifications.addListener('registration', async (token: Token) => {
    await registerTokenWithBackend(token.value);
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('[Push] Registration error:', err);
  });

  // Notification received while app is in foreground — just log it.
  // Capacitor will display it as a local notification automatically on iOS.
  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('[Push] Received in foreground:', notification.title);
  });

  await PushNotifications.register();
}

/**
 * Unregister the current device token from the backend.
 * Call this on logout so the device stops receiving notifications.
 */
export async function removePushToken(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Re-register briefly just to get the current token value
    await PushNotifications.register();
    // The token listener will fire; we can't easily get the value synchronously,
    // so we rely on the server to prune stale tokens after APNs/FCM rejects them.
    // For immediate removal, we'd need to cache the token — see note below.
    const cachedToken = sessionStorage.getItem('push_token');
    if (cachedToken) {
      await apiFetch('/notifications/register', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cachedToken }),
      });
      sessionStorage.removeItem('push_token');
    }
  } catch (err) {
    // Best-effort
    console.warn('[Push] Failed to unregister token:', err);
  }
}

// --- internal ---

async function registerTokenWithBackend(token: string): Promise<void> {
  const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

  // Cache for logout cleanup
  sessionStorage.setItem('push_token', token);

  try {
    await apiFetch('/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform }),
    });
    console.log('[Push] Token registered successfully');
  } catch (err) {
    console.warn('[Push] Failed to register token with backend:', err);
  }
}
