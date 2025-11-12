import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LocationInfo, getLocationInfo } from '@/services/location';

interface LocationState {
  locationInfo: LocationInfo | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  setLocationInfo: (info: LocationInfo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearLocation: () => void;
  fetchLocationIfNeeded: () => Promise<void>;
}

const LOCATION_TTL = 60 * 60 * 1000; // 1 hour - location data rarely changes

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      locationInfo: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      
      setLocationInfo: (info) => set({ locationInfo: info, error: null, lastFetched: Date.now() }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearLocation: () => set({ locationInfo: null, error: null, isLoading: false, lastFetched: null }),
      
      fetchLocationIfNeeded: async () => {
        const state = get();
        const now = Date.now();
        
        // If we have cached location data and it's less than 1 hour old, skip fetch
        if (state.locationInfo && state.lastFetched && (now - state.lastFetched) < LOCATION_TTL) {
          console.log('✅ Using cached location data (age:', Math.round((now - state.lastFetched) / 1000), 'seconds)');
          return;
        }
        
        set({ isLoading: true });
        try {
          console.log('🔄 Fetching location info...');
          const locationInfo = await getLocationInfo();
          set({ locationInfo, error: null, isLoading: false, lastFetched: Date.now() });
        } catch (error) {
          console.error('Failed to fetch location info:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch location info',
            isLoading: false 
          });
        }
      }
    }),
    {
      name: 'location-storage', // localStorage key
      partialize: (state) => ({ 
        locationInfo: state.locationInfo,
        lastFetched: state.lastFetched
      }), // Only persist these fields
    }
  )
);