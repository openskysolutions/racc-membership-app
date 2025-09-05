import { create } from 'zustand';
import { logout, fetchInitialData } from '@/services/auth';

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  const idToken = localStorage.getItem('token-id');
  return {
    user: null,
    isAuthenticated: !!idToken, // initialize from localStorage using Firebase idToken
    isLoading: true, // start in loading until checkAuth finishes
    handleLogout: async () => {
      await logout();
      set({ user: null, isAuthenticated: false });
    },
    checkAuth: async () => {
      set({ isLoading: true });
      // Look for stored Firebase idToken
      const idToken = localStorage.getItem('token-id');
      if (idToken) {
        try {
          // Fetch user profile via ClientClub API
          const userData = await fetchInitialData();
          set({ user: userData, isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    },
  };
});