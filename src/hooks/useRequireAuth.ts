/**
 * Hook to require authentication for protected actions
 * Validates session before allowing the action to proceed
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { validateToken } from '@/services/auth';
import { hasAuthToken } from '@/services/apiClient';

interface UseRequireAuthOptions {
  /**
   * If true, will redirect to login immediately if not authenticated
   * If false, will only return isAuthenticated status
   */
  redirectIfUnauthenticated?: boolean;
  
  /**
   * Required role for access (optional)
   */
  requiredRole?: string | string[];
  
  /**
   * Skip initial validation (useful if you just want to check before an action)
   */
  skipInitialValidation?: boolean;
}

interface UseRequireAuthReturn {
  isAuthenticated: boolean;
  isValidating: boolean;
  hasAccess: boolean;
  checkAuthBeforeAction: () => Promise<boolean>;
  user: any;
}

/**
 * Hook to require authentication for components or actions
 * 
 * @example
 * // Require auth for entire page
 * const { isAuthenticated, isValidating } = useRequireAuth({ redirectIfUnauthenticated: true });
 * 
 * @example
 * // Check before specific action
 * const { checkAuthBeforeAction } = useRequireAuth();
 * const handleEdit = async () => {
 *   if (await checkAuthBeforeAction()) {
 *     // Proceed with edit
 *   }
 * };
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}): UseRequireAuthReturn {
  const {
    redirectIfUnauthenticated = false,
    requiredRole,
    skipInitialValidation = false
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  
  const [isValidating, setIsValidating] = useState(!skipInitialValidation);
  const [hasValidSession, setHasValidSession] = useState(isAuthenticated);

  // Check if user has required role
  const hasAccess = (() => {
    if (!hasValidSession || !user) return false;
    if (!requiredRole) return true;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  })();

  // Initial validation on mount
  useEffect(() => {
    if (skipInitialValidation) return;

    const validateSession = async () => {
      setIsValidating(true);
      
      // Quick check for token first
      if (!hasAuthToken()) {
        setHasValidSession(false);
        setIsValidating(false);
        
        if (redirectIfUnauthenticated) {
          const returnUrl = encodeURIComponent(location.pathname + location.search + location.hash);
          navigate(`/login?returnUrl=${returnUrl}`, { replace: true });
        }
        return;
      }

      // Validate with server
      try {
        await checkAuth();
        setHasValidSession(isAuthenticated);
      } catch (error) {
        console.error('[useRequireAuth] Session validation failed:', error);
        setHasValidSession(false);
        
        if (redirectIfUnauthenticated) {
          const returnUrl = encodeURIComponent(location.pathname + location.search + location.hash);
          navigate(`/login?returnUrl=${returnUrl}`, { replace: true });
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, [skipInitialValidation, redirectIfUnauthenticated]);

  // Function to check auth before a specific action
  const checkAuthBeforeAction = async (): Promise<boolean> => {
    // Quick token check
    if (!hasAuthToken()) {
      console.log('[useRequireAuth] No token found, redirecting to login');
      const returnUrl = encodeURIComponent(location.pathname + location.search + location.hash);
      navigate(`/login?returnUrl=${returnUrl}`, { replace: true });
      return false;
    }

    // Validate with server
    try {
      const isValid = await validateToken();
      
      if (!isValid) {
        console.log('[useRequireAuth] Token validation failed, redirecting to login');
        const returnUrl = encodeURIComponent(location.pathname + location.search + location.hash);
        navigate(`/login?returnUrl=${returnUrl}`, { replace: true });
        return false;
      }

      // Check role if required
      if (requiredRole && !hasAccess) {
        console.warn('[useRequireAuth] User lacks required role:', requiredRole);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[useRequireAuth] Auth check failed:', error);
      const returnUrl = encodeURIComponent(location.pathname + location.search + location.hash);
      navigate(`/login?returnUrl=${returnUrl}`, { replace: true });
      return false;
    }
  };

  return {
    isAuthenticated: hasValidSession,
    isValidating,
    hasAccess,
    checkAuthBeforeAction,
    user
  };
}
