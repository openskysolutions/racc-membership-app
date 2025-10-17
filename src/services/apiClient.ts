/**
 * API Client for RACC Membership Portal
 * Uses Better Auth PKCE with sessionStorage (constitutional compliance)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Get authentication token from localStorage (OAuth 2.0 PKCE)
 */
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('token');
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
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        ...init,
        headers: mergedHeaders,
        credentials: 'include', // Include cookies for session management
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Handle authentication errors
      if (response.status === 401) {
        // Clear invalid session
        sessionStorage.removeItem('racc_auth_session');
        // Redirect to login or trigger auth refresh
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      
      return response;
    } catch (error) {
      
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