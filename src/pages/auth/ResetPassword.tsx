import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/services/apiClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful! Please sign in with your new password.' } });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="flex min-h-full items-center justify-center flex-col p-4 py-20">
        <Card className="w-full max-w-md bg-popover dark:bg-neutral-750 border-stone-500">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              <Alert className="border-red-200 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{tokenError}</AlertDescription>
              </Alert>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              asChild
              className="w-full bg-highlight-foreground hover:bg-highlight-foreground/90"
            >
              <Link to="/forgot-password">Request new reset link</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link to="/login">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-full items-center justify-center flex-col p-4 py-20">
        <Card className="w-full max-w-md bg-popover dark:bg-neutral-750 border-stone-500">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Password reset successful!</CardTitle>
            <CardDescription>
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your password has been successfully reset. You can now sign in with your new password.
                </AlertDescription>
              </Alert>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting to sign in page...
            </p>
            <Button
              asChild
              className="w-full bg-highlight-foreground hover:bg-highlight-foreground/90"
            >
              <Link to="/login">Sign in now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center flex-col p-4 py-20">
      <Card className="w-full max-w-md bg-popover dark:bg-neutral-750 border-stone-500">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Set new password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                New password
              </label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-highlight-foreground hover:bg-highlight-foreground/90"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset password
            </Button>
            
            <div className="text-center">
              <Link 
                to="/login" 
                className="text-sm text-highlight-foreground hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
