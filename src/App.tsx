import AppRoutes from "@/routes";
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { StatusBar } from '@capacitor/status-bar';
import { isNativeApp } from '@/lib/platform';
import { Toaster } from '@/components/ui/sonner';
import { SessionMonitor } from '@/components/SessionMonitor';
import { initPushNotifications, onNotificationTap } from '@/services/pushNotifications';
import { useNavigate } from 'react-router-dom';

import "@/App.css";

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const fetchLocationIfNeeded = useLocationStore(state => state.fetchLocationIfNeeded);
  const navigate = useNavigate();

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

  // Initialize push notifications once the user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    onNotificationTap((action) => {
      const link = action.notification?.data?.link as string | undefined;
      if (link) navigate(link);
    });

    initPushNotifications().catch((err) =>
      console.warn('[Push] Init error:', err)
    );
  }, [isAuthenticated, navigate]);

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
        
        if (isNativeApp()) {
          await StatusBar.show();
          await StatusBar.setOverlaysWebView({overlay: true})
        }
    })()
}, []);

  return (
    <>
      <SessionMonitor />
      <AppRoutes />
      <Toaster />
    </>
  );
}

export default App;
