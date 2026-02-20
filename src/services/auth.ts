// src/services/auth.service.ts

interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}
  
interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    phone?: string;
    website?: string;
    role: string;
    status: string;
    membershipTier?: string;
    emailVerified?: boolean;
    ghlContactId?: string;
    avatarUrl?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  token: string;
}
  
// Define the API base URL with a fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Generate a random code verifier for PKCE
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generate a code challenge from the verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(digest));
  const base64 = btoa(String.fromCharCode(...hashArray));
  return base64
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Exchange authorization code for token using PKCE verifier
 */
export async function exchangeTokenWithCode(code: string, remember: boolean = false): Promise<any> {
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  if (!codeVerifier) throw new Error('Something went wrong, please try logging in again.');
  
  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: window.location.origin + '/auth'
    }),
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || 'Token exchange failed');
  
  // Store token based on "remember me" preference
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('token', data.access_token);
  sessionStorage.removeItem('pkce_code_verifier');
  
  return data;
}

/**
 * OAuth 2.0 PKCE Login Flow
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store code verifier for later use
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    
    // Step 1: Authorization request to your OAuth server
    const authResponse = await fetch(`${API_BASE_URL}/auth/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        codeChallenge: codeChallenge,
        codeChallengeMethod: 'S256',
        redirectUri: window.location.origin + '/auth',
        remember: credentials.remember || false
      }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      throw new Error(errorData.error_description || errorData.error || 'Authorization failed');
    }

    const authData = await authResponse.json();
    
    // Step 2: Exchange authorization code for token (pass remember preference)
    const tokenData = await exchangeTokenWithCode(authData.code, credentials.remember || false);
    
    // Step 3: Fetch user profile using the token
    const userProfile = await getProfile();
    
    return {
      user: userProfile,
      token: tokenData.access_token
    };

  } catch (error) {
    console.error('OAuth login error:', error);
    sessionStorage.removeItem('pkce_code_verifier');
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getProfile(): Promise<AuthResponse['user']> {
  try {
    const token = await getToken();
    if (!token) throw new Error('No token found');
    
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const data = await response.json();
    return data; // Backend returns user data directly, not wrapped in { user: ... }
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('pkce_code_verifier');
}

/**
 * Get stored token from either localStorage or sessionStorage
 */
export async function getToken(): Promise<string | null> {
  // Check localStorage first (remember me), then sessionStorage
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

/**
 * Check if user has token
 */
export async function hasToken(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

/**
 * Validate if the current token is still valid on the backend
 * Returns true if valid, false if invalid/expired
 * Does not throw errors - always returns cleanly
 */
export async function validateToken(): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) return false;

    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    
    // If token is invalid, clear it from storage
    if (!data.valid) {
      await logout();
      return false;
    }

    return data.valid;
  } catch (error) {
    // On any error, consider token invalid
    console.error('Token validation error:', error);
    return false;
  }
}