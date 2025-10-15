import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoLight from '@/assets/racc-logo.png'; // Adjust the path to your logo file
import LogoDark from '@/assets/racc-logo-dark.png';  
import { login } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/providers/theme-provider';

export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore(state => state.setUser);
  const { theme } = useTheme();

  // Get the intended destination from location state, default to home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await login({ email, password });
      setUser(response.user);
      // Redirect to the page they were trying to access, or home if no specific page
      navigate(from, { replace: true });
    } catch (e: any) {
      setError(e.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center flex-col p-4">

      <a
        rel="noreferrer noopener"
        href="https://richfieldareachamber.com"
        className="w-full max-w-md p-8 pb-12"
      >
        <img
          src={theme === "dark" ? LogoDark : LogoLight}
          alt="Richfield Area Chamber of Commerce Logo"
          className="w-full"
        />
      </a>
      <Card className="w-full max-w-md bg-popover dark:bg-neutral-750 border-stone-500">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            {error && <span className="block text-sm text-destructive mt-1">{error}</span>}
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
                type="email"
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
                <a href="/register" className="font-medium text-highlight-foreground hover:underline">
                  Create one
                </a>
              </div>
              <div>
                <span>Existing RACC member? </span>
                <a href="/register-existing" className="font-medium text-highlight-foreground hover:underline">
                  Register with existing contact
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