import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MembersState {
  // Filter and sort states
  searchTerm: string;
  roleFilter: string;
  specialtyFilter: string;
  viewMode: 'grid' | 'list';
  sortBy: 'businessName' | 'memberSince' | 'membershipTier';
  
  // Refresh trigger - timestamp of last member update that requires directory refresh
  lastMemberUpdate: number;
  
  // Actions
  setSearchTerm: (searchTerm: string) => void;
  setRoleFilter: (roleFilter: string) => void;
  setSpecialtyFilter: (specialtyFilter: string) => void;
  setViewMode: (viewMode: 'grid' | 'list') => void;
  setSortBy: (sortBy: 'businessName' | 'memberSince' | 'membershipTier') => void;
  resetFilters: () => void;
  triggerMemberRefresh: () => void;
}

const initialState = {
  searchTerm: '',
  roleFilter: 'all',
  specialtyFilter: 'all',
  viewMode: 'grid' as const,
  sortBy: 'businessName' as const,
  lastMemberUpdate: 0,
};

export const useMembersStore = create<MembersState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setRoleFilter: (roleFilter) => set({ roleFilter }),
      setSpecialtyFilter: (specialtyFilter) => set({ specialtyFilter }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSortBy: (sortBy) => set({ sortBy }),
      resetFilters: () => set(initialState),
      triggerMemberRefresh: () => set({ lastMemberUpdate: Date.now() }),
    }),
    {
      name: 'members-filters', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        sortBy: state.sortBy,
        viewMode: state.viewMode,
        specialtyFilter: state.specialtyFilter,
        // Don't persist search and role filter as they're more temporary
      }),
    }
  )
);
