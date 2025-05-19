import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { generateCodeVerifier, generateCodeChallenge, exchangeTokenWithCode } from '@/services/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const authUrl = import.meta.env.VITE_KEYCLOAK_URL;
const authRealm = import.meta.env.VITE_KEYCLOAK_REALM;
const authClient = import.meta.env.VITE_KEYCLOAK_CLIENT;


export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { checkAuth, isAuthenticated } = useAuthStore((state) => state);

  console.log('isAuthenticated', isAuthenticated);

  // Handle redirect back from Keycloak with authorization code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setIsLoading(true);
      exchangeTokenWithCode(code)
        .then(() => checkAuth())
        .then(() => navigate('/'))
        .catch(err => setError(err instanceof Error ? err.message : String(err)))
        .finally(() => setIsLoading(false));
    }
  }, []);

  // Start PKCE login by generating verifier/challenge and redirecting
  const handleKeycloakLogin = async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem('pkce_code_verifier', verifier);
    const redirectUri = window.location.origin + '/auth';
    const authEndpoint = `${authUrl}/realms/${authRealm}/protocol/openid-connect/auth`;
    const params = new URLSearchParams({
      client_id: authClient,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    window.location.href = `${authEndpoint}?${params.toString()}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md sm:p-8">
        <h1 className="text-2xl font-bold mb-4">Sign in with Keycloak</h1>
        <Button
          onClick={handleKeycloakLogin}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Loading…' : 'Login'}
        </Button>
        {error && <p className="text-danger text-sm mt-2">{error}</p>}
      </Card>
    </div>
  );
}

export default AuthPage;