import { create } from 'zustand';
import { logout, getProfile, validateToken } from '@/services/auth';

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: any) => void;
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

  setUser: (user: any) => {
    set({ 
      user, 
      isAuthenticated: true, 
      isLoading: false, 
      role: user?.role || null 
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      // First, validate the token without fetching profile
      const isValid = await validateToken();
      
      if (!isValid) {
        set({ user: null, isAuthenticated: false, isLoading: false, role: null });
        return;
      }

      // Token is valid, now fetch user profile
      const userData = await getProfile();
      set({ 
        user: userData, 
        isAuthenticated: true, 
        isLoading: false, 
        role: userData.role || null 
      });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false, role: null });
    }
  }
}));