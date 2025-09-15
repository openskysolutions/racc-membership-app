import { create } from 'zustand';
import { LocationInfo } from '@/services/location';

interface LocationState {
  locationInfo: LocationInfo | null;
  isLoading: boolean;
  error: string | null;
  setLocationInfo: (info: LocationInfo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  locationInfo: null,
  isLoading: false,
  error: null,
  setLocationInfo: (info) => set({ locationInfo: info, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearLocation: () => set({ locationInfo: null, error: null, isLoading: false }),
}));