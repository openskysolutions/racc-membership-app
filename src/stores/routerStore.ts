import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RouterState {
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
}

export const useRouterStore = create(
  persist<RouterState>(
    (set) => ({
      currentRoute: '/',
      setCurrentRoute: (route) => set({ currentRoute: route }),
    }),
    {
      name: 'router-store', // Name of the storage key
    }
  )
);