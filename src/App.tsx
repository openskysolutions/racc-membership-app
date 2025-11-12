import AppRoutes from "@/routes";
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
// import { SafeArea } from 'capacitor-plugin-safe-area';
import { StatusBar } from '@capacitor/status-bar';
import { isNativeApp } from '@/lib/platform';
import { Toaster } from '@/components/ui/sonner';

import "@/App.css";

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const fetchLocationIfNeeded = useLocationStore(state => state.fetchLocationIfNeeded);

  useEffect(() => {
    // Check for existing authentication token in either storage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      // No token found: clear loading state without fetching
      useAuthStore.setState({ isLoading: false });
    }
  }, [checkAuth]);

  // Fetch location information on app startup (uses cache if available)
  useEffect(() => {
    fetchLocationIfNeeded();
  }, [fetchLocationIfNeeded]);

  useEffect(() => {
    (async function(){
        // const safeAreaData = await SafeArea.getSafeAreaInsets();
        // const {insets} = safeAreaData;
        // for (const [key, value] of Object.entries(insets)) {
        //     document.documentElement.style.setProperty(
        //         `--safe-area-inset-${key}`,
        //         `${value}px`,
        //     );
        // }
        
        if (isNativeApp()) {
          await StatusBar.show();
          await StatusBar.setOverlaysWebView({overlay: true})
        }
    })()
}, []);

  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}

export default App;
