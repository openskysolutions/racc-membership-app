import { useState, useEffect } from 'react';
import { api } from '@/services/apiClient';

export interface BusinessSubcategory {
  id: string;
  name: string;
  categoryId: string;
  sortOrder: number;
}

export interface BusinessCategory {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  subcategories: BusinessSubcategory[];
}

// Module-level cache so the fetch only happens once per page load regardless of
// how many components call this hook.
let _cache: BusinessCategory[] | null = null;
let _promise: Promise<BusinessCategory[]> | null = null;

async function fetchCategories(): Promise<BusinessCategory[]> {
  if (_cache) return _cache;
  if (!_promise) {
    _promise = api.get('/business-categories')
      .then(r => r.json())
      .then(data => { _cache = data; _promise = null; return data; })
      .catch(err => { _promise = null; throw err; });
  }
  return _promise;
}

export function useBusinessCategories() {
  const [categories, setCategories] = useState<BusinessCategory[]>(_cache ?? []);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) { setCategories(_cache); setLoading(false); return; }
    fetchCategories()
      .then(data => { setCategories(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { categories, loading };
}

// ─── Utility helpers (mirrors the old lib helpers, but work on runtime data) ──

export function getSubcategoryName(subcategoryId: string, categories: BusinessCategory[]): string {
  for (const cat of categories) {
    const sub = cat.subcategories.find(s => s.id === subcategoryId);
    if (sub) return sub.name;
  }
  return subcategoryId;
}

export function getCategoryForSubcategory(
  subcategoryId: string,
  categories: BusinessCategory[]
): BusinessCategory | undefined {
  return categories.find(cat => cat.subcategories.some(s => s.id === subcategoryId));
}
