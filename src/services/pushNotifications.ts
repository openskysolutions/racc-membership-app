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
 * Set a callback that fires when the user taps a push notification.
 * The `notification.notification.data.link` field will contain a route path
 * like "/events/123" that the app can navigate to.
 */
export function onNotificationTap(handler: NotificationTapHandler) {
  tapHandler = handler;
}

/**
 * Initialize push notifications for the current session.
 * Call this once after the user has authenticated.
 */
export async function initPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // Request / check permission
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.log('[Push] Permission not granted:', permStatus.receive);
    return;
  }

  // Register with APNs / FCM — fires Token event on success

  // Remove previous listeners to avoid duplicates on re-login,
  // then add new ones BEFORE calling register() so we never miss
  // a synchronously-fired token event (iOS caches tokens).
  await PushNotifications.removeAllListeners();

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

  // User tapped a notification
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    if (tapHandler) tapHandler(action);
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
