/**
 * Application configuration utilities
 */

/**
 * Get the base URL for the application
 * In mobile builds, uses the production URL from env vars
 * In web builds, uses the current origin
 */
export function getAppBaseUrl(): string {
  const isMobile = import.meta.env.VITE_PLATFORM === 'mobile';
  
  if (isMobile) {
    // For mobile, use the API base URL but remove the /api suffix
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (apiBaseUrl) {
      return apiBaseUrl.replace(/\/api\/?$/, '');
    }
  }
  
  // For web or fallback, use current origin
  return window.location.origin;
}

/**
 * Get the API base URL
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`;
}
