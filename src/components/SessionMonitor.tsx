/**
 * SessionMonitor Component
 * Monitors user session and handles expiration gracefully
 * Should be included once at the app root level
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { validateToken } from '@/services/auth';
import { hasAuthToken } from '@/services/apiClient';
import { toast } from 'sonner';

interface SessionMonitorProps {
  /**
   * How often to check session validity (in milliseconds)
   * Default: 5 minutes
   */
  checkInterval?: number;
  
  /**
   * Whether to show toast notifications for session events
   * Default: true
   */
  showNotifications?: boolean;
}

export function SessionMonitor({ 
  checkInterval = 5 * 60 * 1000, // 5 minutes
  showNotifications = true 
}: SessionMonitorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, handleLogout, checkAuth } = useAuthStore();
  const lastCheckRef = useRef<number>(0);
  const isCheckingRef = useRef<boolean>(false);

  useEffect(() => {
    // Don't monitor if not authenticated
    if (!isAuthenticated) {
      return;
    }

    // Function to check session validity
    const checkSession = async () => {
      // Prevent concurrent checks
      if (isCheckingRef.current) {
        return;
      }

      const now = Date.now();
      
      // Don't check too frequently
      if (now - lastCheckRef.current < checkInterval) {
        return;
      }

      isCheckingRef.current = true;
      lastCheckRef.current = now;

      try {
        // Quick token check
        if (!hasAuthToken()) {
          console.log('[SessionMonitor] Token missing - session expired');
          if (showNotifications) {
            toast.error('Your session has expired. Please sign in again.');
          }
          await handleLogout();
          return;
        }

        // Validate with server
        const isValid = await validateToken();
        
        if (!isValid) {
          console.log('[SessionMonitor] Token invalid - session expired');
          if (showNotifications) {
            toast.error('Your session has expired. Please sign in again.');
          }
          await handleLogout();
          
          // Redirect to login with return URL
          const currentPath = location.pathname + location.search + location.hash;
          if (!currentPath.startsWith('/auth/')) {
            const returnUrl = encodeURIComponent(currentPath);
            navigate(`/auth/login?returnUrl=${returnUrl}`, { replace: true });
          }
        } else {
          // Refresh auth store with latest data
          await checkAuth();
        }
      } catch (error) {
        console.error('[SessionMonitor] Session check failed:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Check immediately on mount
    checkSession();

    // Set up periodic checking
    const intervalId = setInterval(checkSession, checkInterval);

    // Check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[SessionMonitor] Tab became visible, checking session...');
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check on focus (when user clicks back into window)
    const handleFocus = () => {
      console.log('[SessionMonitor] Window focused, checking session...');
      checkSession();
    };

    window.addEventListener('focus', handleFocus);

    // Listen for 401 events from API client
    const handle401Event = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[SessionMonitor] Received 401 unauthorized event:', customEvent.detail);
      
      if (showNotifications) {
        toast.error('Your session has expired. Please sign in again.');
      }
      
      handleLogout();
    };

    window.addEventListener('auth:unauthorized', handle401Event);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('auth:unauthorized', handle401Event);
    };
  }, [isAuthenticated, checkInterval, showNotifications, handleLogout, navigate, location, checkAuth]);

  // This component doesn't render anything
  return null;
}
