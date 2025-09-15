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
    type: string;
    persona: string;
    organization?: {
      id: string;
      name: string;
      type: string;
    };
  };
  token: string;
}
  
// Define the API base URL with a fallback
const GHL_API_BASE_URL = import.meta.env.VITE_GHL_API_URL || 'http://localhost:3000/api';
const GHL_APP_DOMAIN = import.meta.env.VITE_GHL_APP_DOMAIN || 'localhost';
const GHL_LOCATION_ID = import.meta.env.VITE_LOCATION_ID || '';
const GHL_GROUP_ID = import.meta.env.VITE_GHL_GROUP_ID || 'default-group';

// Keycloak PKCE constants
const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL as string;
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM as string;
const keycloakClient = import.meta.env.VITE_KEYCLOAK_CLIENT as string;

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
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: keycloakClient,
    code,
    code_verifier: codeVerifier,
    redirect_uri: window.location.origin + '/auth',
  });

  const response = await fetch(
    `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || 'Token exchange failed');
  console.log('Token exchange successful:', data);
  localStorage.setItem('token', data.access_token);
  return data;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    console.log('Attempting login at:', `${GHL_API_BASE_URL}/clientclub/auth/login`);
    
    // prepare deviceId (persisted per client)
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId && window.crypto?.randomUUID) {
      deviceId = window.crypto.randomUUID();
      localStorage.setItem('deviceId', deviceId);
    }
    // assemble new API payload
    const payload = {
      email: credentials.email,
      password: credentials.password,
      userId: '',
      deviceName: navigator.userAgent,
      deviceId: deviceId || '',
      deviceType: 'web',
      releaseVersionCode: null,
      appType: 'WL',
      domainName: GHL_APP_DOMAIN,
      locationId: GHL_LOCATION_ID,
      ipAddress: '0.0.0.1',
      redirectUrl: null,
    };
    const response = await fetch(`${GHL_API_BASE_URL}/clientclub/auth/login/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Log the raw response for debugging
    console.log('Login response status:', response.status);
    const rawText = await response.text();
    console.log('Raw login response:', rawText);

    // Try to parse if there's content
    let data;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (e) {
      console.error('Failed to parse login JSON:', e);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(data?.error || 'Login failed');
    }

    if (!data) {
      throw new Error('Empty response from server');
    }

    // Exchange the custom token for a Firebase idToken
    const customToken = data.token;
    const googleCustomToken = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${import.meta.env.VITE_GOOGLE_CUSTOM_TOKEN_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      }
    );
    const googleCustomTokenData = await googleCustomToken.json();
    console.log('Firebase token exchange response:', googleCustomTokenData);
    if (!googleCustomToken.ok) {
      throw new Error(googleCustomTokenData.error?.message || 'Token exchange failed');
    }
    // Persist the Firebase idToken for subsequent API calls
    localStorage.setItem('token-id', googleCustomTokenData.idToken);
    // Fetch initial profile data now that we're authenticated
    await fetchInitialData();
    // Return the original user object and new idToken
    return { user: data.user, token: googleCustomTokenData.idToken };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function getProfile(): Promise<AuthResponse['user']> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    
    const response = await fetch(`${GHL_API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const rawText = await response.text();

    let data;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch (e) {
      console.error('Failed to parse profile JSON:', e);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to get profile');
    }

    if (!data) {
      throw new Error('Empty response from server');
    }

    return data;
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  localStorage.removeItem('token');
  localStorage.removeItem('token-id');
}

export async function getToken(): Promise<string | null> {
  // Return the Firebase idToken stored under 'token-id'
  return localStorage.getItem('token-id');
}

export async function hasToken(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

export async function fetchInitialData() {
  const idToken = localStorage.getItem('token-id');
  if (!idToken) throw new Error('Missing token-id for profile fetch');
  // Decode JWT to extract Firebase user_id
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const payload = JSON.parse(atob(parts[1]));
  const userId = payload.user_id;
  if (!userId) throw new Error('Missing user_id in token payload');
  const url = `${GHL_API_BASE_URL}/communities/${GHL_LOCATION_ID}/groups/${GHL_GROUP_ID}/users/${userId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'token-id': idToken,
      'source': 'PORTAL_USER',
      'channel': 'APP'
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch user profile');
  }
  return data;
}