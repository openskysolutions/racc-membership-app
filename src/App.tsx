import AppRoutes from "@/routes";
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { getLocationInfo } from '@/services/location';
import { SafeArea } from 'capacitor-plugin-safe-area';

import "@/App.css";

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const { setLocationInfo, setLoading, setError } = useLocationStore();

  useEffect(() => {
    // Check for existing session (Better Auth PKCE uses sessionStorage per constitutional requirements)
    const sessionData = sessionStorage.getItem('racc_auth_session');
    if (sessionData) {
      checkAuth();
    } else {
      // Not logged in: clear loading state without fetching
      useAuthStore.setState({ isLoading: false });
    }
  }, [checkAuth]);

  // Fetch location information on app startup
  useEffect(() => {
    const fetchLocationInfo = async () => {
      setLoading(true);
      try {
        const locationInfo = await getLocationInfo();
        setLocationInfo(locationInfo);
      } catch (error) {
        console.error('Failed to fetch location info:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch location info');
      } finally {
        setLoading(false);
      }
    };

    fetchLocationInfo();
  }, [setLocationInfo, setLoading, setError]);

  useEffect(() => {
    (async function(){
        const safeAreaData = await SafeArea.getSafeAreaInsets();
        const {insets} = safeAreaData;
        for (const [key, value] of Object.entries(insets)) {
            document.documentElement.style.setProperty(
                `--safe-area-inset-${key}`,
                `${value}px`,
            );
        }
    })()
}, []);

  return (
    <AppRoutes />
  );
}

export default App;
