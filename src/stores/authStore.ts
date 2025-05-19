import { create } from 'zustand';
import { hasToken, logout } from '@/services/auth';

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  const token = localStorage.getItem('token');
  return {
    user: null,
    isAuthenticated: !!token, // initialize from localStorage
    isLoading: true, // start in loading until checkAuth finishes
    handleLogout: async () => {
      await logout();
      set({ user: null, isAuthenticated: false });
    },
    checkAuth: async () => {
      set({ isLoading: true });
      const hasValidToken = await hasToken();
      if (hasValidToken) {
        try {
          // const profile = await getProfile();
          set({ isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Failed to get profile:', error);
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    },
  };
});