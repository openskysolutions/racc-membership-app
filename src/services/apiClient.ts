/**
 * API Client for RACC Membership Portal
 * Uses Better Auth PKCE with sessionStorage (constitutional compliance)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Track if we're currently redirecting to avoid multiple redirects
let isRedirecting = false;

/**
 * Handle 401 Unauthorized response by redirecting to sign-in
 * Clears all auth tokens and preserves the current URL to return after login
 */
export function handle401Redirect(): void {
  // Prevent multiple simultaneous redirects
  if (isRedirecting) {
    return;
  }
  isRedirecting = true;
  
  // Clear invalid session and tokens
  sessionStorage.removeItem('racc_auth_session');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('pkce_code_verifier');
  localStorage.removeItem('token');
  
  // Clear auth store state
  localStorage.removeItem('auth-storage');
  
  // Get current path to return to after login (exclude auth routes)
  const currentPath = window.location.pathname + window.location.search + window.location.hash;
  const isAuthRoute = currentPath.startsWith('/login') || currentPath.startsWith('/connect-account');
  const returnUrl = !isAuthRoute ? encodeURIComponent(currentPath) : '';
  
  // Trigger custom event for any listeners (before redirect)
  window.dispatchEvent(new CustomEvent('auth:unauthorized', { 
    detail: { returnUrl: currentPath }
  }));
  
  // Redirect to sign-in page with return URL
  console.log('[Auth] 401 Unauthorized - Session expired. Redirecting to sign-in...', 
    returnUrl ? `Return URL: ${currentPath}` : '');
  
  // Small delay to ensure event listeners can process
  setTimeout(() => {
    window.location.href = returnUrl 
      ? `/login?returnUrl=${returnUrl}` 
      : '/login';
  }, 100);
}

/**
 * Check if user is authenticated (has valid token)
 * This is a synchronous check - doesn't validate with server
 */
export function hasAuthToken(): boolean {
  const token = getAuthToken();
  return !!token;
}

/**
 * Get authentication token from localStorage or sessionStorage (OAuth 2.0 PKCE)
 * Checks localStorage first (remember me), then sessionStorage (session only)
 */
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  } catch (error) {
    console.warn('Failed to retrieve auth token:', error);
  }
  return null;
}

/**
 * Enhanced fetch wrapper for RACC API calls with retry logic
 * Automatically handles authentication and base URL
 */
export async function apiFetch(endpoint: string, init?: RequestInit, retries: number = 2): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const token = getAuthToken();
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const mergedHeaders = new Headers(defaultHeaders);
  if (init?.headers) {
    const initHeaders = new Headers(init.headers as HeadersInit);
    initHeaders.forEach((value, key) => mergedHeaders.set(key, value));
  }
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // console.log(`[API] Request attempt ${attempt + 1}/${retries + 1} to:`, url);
      
      const response = await fetch(url, {
        ...init,
        headers: mergedHeaders,
        credentials: 'include', // Include cookies for session management
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Handle authentication errors - throw special error that prevents retry
      if (response.status === 401) {
        console.warn('[Auth] Received 401 Unauthorized response');
        handle401Redirect();
        // Throw a special error to break out of retry loop
        throw new Error('UNAUTHORIZED_SESSION_EXPIRED');
      }
      
      return response;
    } catch (error) {
      // If it's our special auth error, don't retry - just rethrow
      if (error instanceof Error && error.message === 'UNAUTHORIZED_SESSION_EXPIRED') {
        throw error;
      }
      
      console.error(`[API] Request failed (attempt ${attempt + 1}/${retries + 1}):`, {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name
      });
      
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('All retry attempts failed');
}

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
  get: (endpoint: string) => apiFetch(endpoint),
  
  post: (endpoint: string, data?: any) => apiFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  put: (endpoint: string, data?: any) => apiFetch(endpoint, {
    method: 'PUT', 
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  patch: (endpoint: string, data?: any) => apiFetch(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  delete: (endpoint: string) => apiFetch(endpoint, {
    method: 'DELETE',
  }),
};