/**
 * Cross-tab session relay.
 *
 * Problem: the access token lives in sessionStorage by default (constitutional
 * requirement - never persist long-lived tokens to localStorage), but
 * sessionStorage is scoped to a single tab. When a logged-in user opens a
 * shared/direct link (email, text, Slack, etc.), the browser opens it in a
 * brand new tab that has no sessionStorage entry, so the app treats them as
 * logged out even though another tab has an active session.
 *
 * Fix: use BroadcastChannel to let a tab without a token ask other open tabs
 * for one. The token itself is only ever passed in-memory between tabs and
 * written to the new tab's sessionStorage - it is never persisted to
 * localStorage, so this keeps the ephemeral-storage requirement intact.
 */

const CHANNEL_NAME = 'racc-auth-relay';
const RESPONSE_TIMEOUT_MS = 400;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(CHANNEL_NAME);
}

function getLocalToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

/** Respond to other tabs asking whether this tab holds an active session token. */
export function listenForTokenRequests(): void {
  const channel = getChannel();
  if (!channel) return;

  channel.onmessage = (event) => {
    if (event.data?.type !== 'request-token') return;
    const token = getLocalToken();
    if (token) {
      channel.postMessage({ type: 'token-response', token });
    }
  };
}

/** Ask other open tabs for an active session token. Resolves to null if none respond in time. */
export function requestTokenFromOtherTabs(): Promise<string | null> {
  const channel = getChannel();
  if (!channel) return Promise.resolve(null);

  return new Promise((resolve) => {
    let settled = false;

    const finish = (token: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.close();
      resolve(token);
    };

    channel.onmessage = (event) => {
      if (event.data?.type === 'token-response' && event.data.token) {
        finish(event.data.token);
      }
    };

    const timer = setTimeout(() => finish(null), RESPONSE_TIMEOUT_MS);
    channel.postMessage({ type: 'request-token' });
  });
}
