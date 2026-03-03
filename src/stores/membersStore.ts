import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MembersState {
  // Filter and sort states
  searchTerm: string;
  roleFilter: string;
  specialtyFilter: string;
  viewMode: 'grid' | 'list';
  sortBy: 'businessName' | 'memberSince' | 'membershipTier';
  
  // Actions
  setSearchTerm: (searchTerm: string) => void;
  setRoleFilter: (roleFilter: string) => void;
  setSpecialtyFilter: (specialtyFilter: string) => void;
  setViewMode: (viewMode: 'grid' | 'list') => void;
  setSortBy: (sortBy: 'businessName' | 'memberSince' | 'membershipTier') => void;
  resetFilters: () => void;
}

const initialState = {
  searchTerm: '',
  roleFilter: 'all',
  specialtyFilter: 'all',
  viewMode: 'grid' as const,
  sortBy: 'businessName' as const,
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
