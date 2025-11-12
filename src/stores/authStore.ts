import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logout, getProfile, validateToken } from '@/services/auth';

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  handleLogout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: any) => void;
  role: string | null;
  lastValidated: number | null; // Timestamp of last validation
}

const VALIDATION_TTL = 5 * 60 * 1000; // 5 minutes - revalidate after this time

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      role: null,
      lastValidated: null,

      handleLogout: async () => {
        await logout();
        set({ user: null, isAuthenticated: false, role: null, lastValidated: null });
      },

      setUser: (user: any) => {
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false, 
          role: user?.role || null,
          lastValidated: Date.now()
        });
      },

      checkAuth: async () => {
        const state = get();
        const now = Date.now();
        
        // If we have cached auth data and it's less than 5 minutes old, use it
        if (state.user && state.lastValidated && (now - state.lastValidated) < VALIDATION_TTL) {
          console.log('✅ Using cached auth data (age:', Math.round((now - state.lastValidated) / 1000), 'seconds)');
          set({ isLoading: false });
          return;
        }
        
        set({ isLoading: true });
        
        try {
          console.log('🔄 Validating auth token...');
          // First, validate the token without fetching profile
          const isValid = await validateToken();
          
          if (!isValid) {
            set({ user: null, isAuthenticated: false, isLoading: false, role: null, lastValidated: null });
            return;
          }

          // Token is valid, now fetch user profile
          console.log('🔄 Fetching user profile...');
          const userData = await getProfile();
          set({ 
            user: userData, 
            isAuthenticated: true, 
            isLoading: false, 
            role: userData.role || null,
            lastValidated: Date.now()
          });
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false, role: null, lastValidated: null });
        }
      }
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        lastValidated: state.lastValidated
      }), // Only persist these fields
    }
  )
);