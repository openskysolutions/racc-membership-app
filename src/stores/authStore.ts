import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logout, fetchInitialData } from '@/services/auth';

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  role: string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      role: null,

      handleLogout: async () => {
        await logout();
        set({ user: null, isAuthenticated: false, role: null });
      },
      checkAuth: async () => {
        set({ isLoading: true });
        const idToken = localStorage.getItem('token-id');
        if (!idToken) {
          // No token: not logged in
          set({ user: null, isAuthenticated: false, isLoading: false, role: null });
          return;
        }
        // Decode JWT payload to get user_id
        let userId = '';
        try {
          const payload = JSON.parse(atob(idToken.split('.')[1]));
          userId = payload.user_id || '';
        } catch (err) {
          console.error('Invalid token payload:', err);
        }
        if (!userId) {
          // Token present but missing userId: treat as unauthenticated
          set({ user: null, isAuthenticated: false, isLoading: false, role: null });
          return;
        }
        // We have both token and userId: proceed to fetch profile
        try {
          const userData = await fetchInitialData();
          set({ user: userData, isAuthenticated: true, isLoading: false, role: userData.role || null });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          set({ user: null, isAuthenticated: false, isLoading: false, role: null });
        }
      }
    }),
    {
      name: 'auth', // storage key
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, role: state.role }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);