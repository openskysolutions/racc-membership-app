// src/services/auth.service.ts

interface LoginCredentials {
  email: string;
  password: string;
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
export async function exchangeTokenWithCode(code: string): Promise<any> {
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  if (!codeVerifier) throw new Error('Missing PKCE code verifier');
  
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
  
  localStorage.setItem('token', data.access_token);
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
        redirectUri: window.location.origin + '/auth'
      }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      throw new Error(errorData.error_description || errorData.error || 'Authorization failed');
    }

    const authData = await authResponse.json();
    
    // Step 2: Exchange authorization code for token
    const tokenData = await exchangeTokenWithCode(authData.code);
    
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
    const token = localStorage.getItem('token');
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
  sessionStorage.removeItem('pkce_code_verifier');
}

/**
 * Get stored token
 */
export async function getToken(): Promise<string | null> {
  return localStorage.getItem('token');
}

/**
 * Check if user has token
 */
export async function hasToken(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}