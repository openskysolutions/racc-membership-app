import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore(state => state.setUser);

  // Get the intended destination from location state or query params
  // Priority: 1) returnUrl query param (from 401 redirect), 2) location state, 3) home page
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('returnUrl');
  const from = returnUrl ? decodeURIComponent(returnUrl) : (location.state?.from?.pathname || '/');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await login({ email, password, remember });
      setUser(response.user);
      // Redirect to the page they were trying to access, or home if no specific page
      console.log('[Login] Redirecting to:', from);
      navigate(from, { replace: true });
    } catch (e: any) {
      // Check if the error message contains the membership_expired reason
      const errorMessage = e.message || 'Login failed';
      if (errorMessage.includes('membership_expired')) {
        setError('membership_expired');
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center flex-col p-4 py-20">
      <Card className="w-full max-w-md bg-popover dark:bg-neutral-750 border-stone-500">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            {error && error === 'membership_expired' ? (
              <div className="mt-4 p-4 border border-highlight-foreground/30 dark:border-highlight-foreground/30 rounded-md">
                <p className="text-sm text-highlight-foreground dark:text-highlight-foreground mb-3 font-medium">
                  Your Richfield Area Chamber of Commerce membership is past its expiration.
                </p>
                <div className="flex flex-col justify-between gap-2">
                  <Button 
                    onClick={() => navigate('/join')}
                    className="bg-highlight-foreground hover:bg-highlight-foreground/90"
                  >
                    Renew Now
                  </Button>
                  <Button 
                    onClick={() => navigate('/contact')}
                    variant="ghost"
                    className="text-highlight-foreground hover:text-highlight-foreground dark:text-highlight-foreground hover:bg-highlight-foreground/10 dark:hover:bg-highlight-foreground/10"
                  >
                    or Contact us here to renew your membership
                  </Button>
                </div>
              </div>
            ) : error ? (
              <span className="block text-sm text-destructive mt-1">{error}</span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="remember" className="flex items-center space-x-2">
                <Input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span className="text-sm">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <Button type="submit" className="w-full bg-highlight-foreground">
              Sign in
            </Button>
            <div className="text-sm text-center pt-4 space-y-2">
              <div>
                <span>Don't have an account? </span>
                <a href="/join" className="font-medium text-highlight-foreground hover:underline">
                  Create one
                </a>
              </div>
              <div>
                <span>Existing RACC member? </span>
                <a href="/connect-account" className="font-medium text-highlight-foreground hover:underline">
                  Register current membership
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;