import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** How long cached member data is considered fresh (5 minutes) */
export const MEMBERS_CACHE_TTL = 5 * 60 * 1000;

interface MembersState {
  // Filter and sort states
  searchTerm: string;
  roleFilter: string;
  specialtyFilter: string;
  categoryFilter: string; // top-level category id, e.g. 'food-beverage', or '' for all
  viewMode: 'grid' | 'list';
  sortBy: 'businessName' | 'memberSince' | 'membershipTier';
  
  // Refresh trigger - timestamp of last member update that requires directory refresh
  lastMemberUpdate: number;

  // Cached member list so navigating back to the directory is instant
  cachedMembers: any[];
  cachedTotal: number;
  cacheTimestamp: number;
  
  // Actions
  setSearchTerm: (searchTerm: string) => void;
  setRoleFilter: (roleFilter: string) => void;
  setSpecialtyFilter: (specialtyFilter: string) => void;
  setCategoryFilter: (categoryFilter: string) => void;
  setViewMode: (viewMode: 'grid' | 'list') => void;
  setSortBy: (sortBy: 'businessName' | 'memberSince' | 'membershipTier') => void;
  resetFilters: () => void;
  triggerMemberRefresh: () => void;
  setCachedMembers: (members: any[], total: number) => void;
}

const initialState = {
  searchTerm: '',
  roleFilter: 'all',
  specialtyFilter: 'all',
  categoryFilter: '',
  viewMode: 'grid' as const,
  sortBy: 'businessName' as const,
  lastMemberUpdate: 0,
  cachedMembers: [],
  cachedTotal: 0,
  cacheTimestamp: 0,
};

export const useMembersStore = create<MembersState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setRoleFilter: (roleFilter) => set({ roleFilter }),
      setSpecialtyFilter: (specialtyFilter) => set({ specialtyFilter }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSortBy: (sortBy) => set({ sortBy }),
      resetFilters: () => set(initialState),
      triggerMemberRefresh: () => set({ lastMemberUpdate: Date.now(), cacheTimestamp: 0 }),
      setCachedMembers: (members, total) => set({ cachedMembers: members, cachedTotal: total, cacheTimestamp: Date.now() }),
    }),
    {
      name: 'members-filters', // localStorage key
      partialize: (state) => ({
        // Persist filters, view preferences, and the member data cache
        sortBy: state.sortBy,
        viewMode: state.viewMode,
        specialtyFilter: state.specialtyFilter,
        cachedMembers: state.cachedMembers,
        cachedTotal: state.cachedTotal,
        cacheTimestamp: state.cacheTimestamp,
      }),
    }
  )
);
