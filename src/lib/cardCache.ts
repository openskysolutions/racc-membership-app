/**
 * Remembers the member's own card on this device so "Show my card" works while
 * signed out or offline. Only holds what the card already shows publicly.
 */

const STORAGE_KEY = 'racc_my_card';

export interface CachedCard {
  publicId: string;
  name: string;
  businessName?: string;
  logoUrl?: string;
}

export function readCachedCard(): CachedCard | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.publicId === 'string' && typeof parsed?.name === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedCard(card: CachedCard): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(card));
  } catch {
    // Storage unavailable (private mode, quota) — the card just won't be available signed out.
  }
}

export function clearCachedCard(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
