/**
 * Keeps the businesses + contacts caches (see contactsCache.ts) warm so the
 * member directory (GET /businesses) almost never has to wait on a live GHL
 * API call. Prewarmed at server startup and refreshed on an interval shorter
 * than the cache TTL, plus refreshed on-demand after any mutation that
 * invalidates the caches.
 */

import { ghlService } from '@/services/gohighlevel';
import { contactsCache, businessesCache } from '@/services/contactsCache';

const REFRESH_INTERVAL_MS = 4 * 60 * 1000; // shorter than the 5-minute cache TTL

let inFlight: Promise<void> | null = null;

/** Fetch fresh businesses + contacts from GHL and populate both caches. */
export async function refreshDirectoryCache(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const [businesses, contacts] = await Promise.all([
      ghlService.getAllBusinessRecords(),
      ghlService.getAllContacts(),
    ]);
    businessesCache.set(businesses);
    contactsCache.set(contacts);
  })();
  try {
    await inFlight;
  } finally {
    inFlight = null;
  }
}

/** Fire-and-forget refresh — use after invalidating so the next reader hits a warm cache. */
export function refreshDirectoryCacheInBackground(): void {
  refreshDirectoryCache().catch(err => {
    console.error('[directoryCache] background refresh failed:', err.message);
  });
}

/** Call once at server startup: prewarm immediately, then keep warm on an interval. */
export function startDirectoryCachePrewarm(): void {
  refreshDirectoryCacheInBackground();
  setInterval(refreshDirectoryCacheInBackground, REFRESH_INTERVAL_MS);
}
