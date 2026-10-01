/**
 * Shared in-memory caches for GHL contacts and businesses.
 * Populated by admin routes; consumed by any route that needs these lists
 * without hitting the GHL API on every request.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes

function makeCache<T>() {
  let cache: { items: T[]; fetchedAt: number } | null = null;
  let invalidated = false;

  return {
    get(): T[] | null {
      if (!cache || invalidated || Date.now() - cache.fetchedAt >= TTL_MS) return null;
      return cache.items;
    },
    /** Last known data regardless of freshness - last-resort fallback when a live refetch fails. */
    getStale(): T[] | null {
      return cache?.items ?? null;
    },
    set(items: T[]): void {
      cache = { items, fetchedAt: Date.now() };
      invalidated = false;
    },
    invalidate(): void {
      invalidated = true;
    },
    isFresh(): boolean {
      return !!cache && !invalidated && Date.now() - cache.fetchedAt < TTL_MS;
    },
  };
}

// ── Contacts cache ────────────────────────────────────────────────────────────
const _contactsCache = makeCache<any>();

export const contactsCache = {
  ..._contactsCache,

  /** Return contacts for a specific businessId if the cache is fresh, otherwise null. */
  getByBusinessId(businessId: string): any[] | null {
    const all = this.get();
    if (!all) return null;
    return all.filter((c: any) => c.businessId === businessId);
  },
};

// ── Businesses cache ──────────────────────────────────────────────────────────
export const businessesCache = makeCache<any>();
