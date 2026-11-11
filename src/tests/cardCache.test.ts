import { describe, it, expect, beforeEach } from 'vitest';
import { readCachedCard, writeCachedCard, clearCachedCard } from '@/lib/cardCache';

describe('cardCache', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when nothing is cached', () => {
    expect(readCachedCard()).toBeNull();
  });

  it('round-trips a card', () => {
    writeCachedCard({ publicId: 'abc12345', name: 'Ada Lovelace', businessName: 'Analytical Engines' });
    expect(readCachedCard()).toEqual({ publicId: 'abc12345', name: 'Ada Lovelace', businessName: 'Analytical Engines' });
  });

  it('ignores corrupt or malformed data', () => {
    localStorage.setItem('racc_my_card', '{not json');
    expect(readCachedCard()).toBeNull();
    localStorage.setItem('racc_my_card', JSON.stringify({ publicId: 5 }));
    expect(readCachedCard()).toBeNull();
  });

  it('clears the cached card', () => {
    writeCachedCard({ publicId: 'abc12345', name: 'Ada' });
    clearCachedCard();
    expect(readCachedCard()).toBeNull();
  });
});
