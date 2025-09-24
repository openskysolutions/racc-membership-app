// Better Auth PKCE authentication service
// Implements OAuth 2.1/OIDC Authorization Code with PKCE flow per constitutional requirements

interface PKCECredentials {
  email: string;
  password: string;
}

interface AuthSession {
  id: string;
  memberId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

interface AuthResponse {
  session: AuthSession;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
}

// API base URL for RACC backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';


/**
 * Generate PKCE code verifier and challenge
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[byte % 64]
  ).join('');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Better Auth PKCE login implementation
 * Updated to use the streamlined /session endpoint
 */
export async function login(credentials: PKCECredentials): Promise<AuthResponse> {
  try {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    console.log('🔐 Starting PKCE login flow...');
    
    // Use the streamlined /session endpoint that handles the full PKCE flow
    const sessionResponse = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        codeChallenge,
        codeVerifier
      }),
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json().catch(() => ({}));
      console.error('❌ Login failed:', errorData);
      throw new Error(errorData.error_description || errorData.message || 'Login failed');
    }

    const sessionData = await sessionResponse.json();
    console.log('✅ Login successful:', sessionData.user?.email);
    
    // Store complete session data in sessionStorage (constitutional requirement: ephemeral storage)
    const authSessionData = {
      sessionId: sessionData.session.sessionId,
      token: sessionData.session.accessToken,
      memberId: sessionData.user.id,
      expiresAt: sessionData.session.expiresAt,
      user: sessionData.user
    };
    
    sessionStorage.setItem('racc_auth_session', JSON.stringify(authSessionData));
    
    return {
      session: {
        id: sessionData.session.sessionId,
        memberId: sessionData.user.id.toString(),
        token: sessionData.session.accessToken,
        expiresAt: sessionData.session.expiresAt,
        createdAt: new Date().toISOString()
      },
      user: {
        id: sessionData.user.id.toString(),
        name: `${sessionData.user.firstName} ${sessionData.user.lastName}`,
        email: sessionData.user.email,
        role: sessionData.user.role,
        status: sessionData.user.status
      }
    };
  } catch (error) {
    console.error('PKCE login error:', error);
    throw error;
  }
}

/**
 * Registration interface
 */
interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  businessName?: string;
  website?: string;
  membershipTier?: 'standard' | 'premium' | 'corporate';
}

interface RegistrationResponse {
  message: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    businessName?: string;
    phone?: string;
    website?: string;
    role: string;
    status: string;
    membershipTier: string;
    ghlContactId: string;
  };
  payment: {
    required: boolean;
    tier: {
      name: string;
      price: number;
      currency: string;
      description: string;
    };
    paymentLink: string;
  };
  nextSteps: string[];
}

/**
 * User registration with GoHighLevel integration
 */
export async function register(data: RegistrationData): Promise<RegistrationResponse> {
  try {
    console.log('📝 Starting user registration...');
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Registration failed:', errorData);
      throw new Error(errorData.message || 'Registration failed');
    }

    const registrationData = await response.json();
    console.log('✅ Registration successful:', registrationData.user?.email);
    
    return registrationData;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Get current user profile using session authentication
 */
export async function getProfile(): Promise<AuthResponse['user']> {
  try {
    const sessionData = sessionStorage.getItem('racc_auth_session');
    if (!sessionData) {
      throw new Error('No active session found');
    }
    
    const session = JSON.parse(sessionData);
    const token = session.token;
    
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get profile');
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error;
  }
}

/**
 * Logout and clear session (ephemeral storage as per constitution)
 */
export async function logout(): Promise<void> {
  const sessionData = sessionStorage.getItem('racc_auth_session');
  
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      const token = session.token;
      
      // Notify backend to invalidate session
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local cleanup even if API call fails
    }
  }
  
  // Clear all auth-related data from sessionStorage
  sessionStorage.removeItem('racc_auth_session');
  sessionStorage.removeItem('pkce_code_verifier');
}

/**
 * Check if user has a valid session
 */
export async function checkSession(): Promise<boolean> {
  try {
    const sessionData = sessionStorage.getItem('racc_auth_session');
    if (!sessionData) {
      return false;
    }

    const session = JSON.parse(sessionData);
    const token = session.token;

    const response = await fetch(`${API_BASE_URL}/auth/check-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Session is invalid, clean up
      sessionStorage.removeItem('racc_auth_session');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    // Clean up on error
    sessionStorage.removeItem('racc_auth_session');
    return false;
  }
}