import { create } from 'zustand';
import { logout, getProfile, hasToken } from '@/services/auth';

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  role: string | null;
}

export const useAuthStore = create<AuthState>()((set) => ({
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
    
    try {
      // Check if session is valid (uses sessionStorage internally per constitutional requirements)
      const isValid = await hasToken();
      
      if (!isValid) {
        set({ user: null, isAuthenticated: false, isLoading: false, role: null });
        return;
      }

      // Session is valid, fetch user profile
      const userData = await getProfile();
      set({ 
        user: userData, 
        isAuthenticated: true, 
        isLoading: false, 
        role: userData.type || null 
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ user: null, isAuthenticated: false, isLoading: false, role: null });
    }
  }
}));