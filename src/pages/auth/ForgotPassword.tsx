import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/services/apiClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-full items-center justify-center flex-col p-4 py-20">
        <Card className="w-full max-w-md bg-popover dark:bg-neutral-750 border-stone-500">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Check your email:</CardTitle>
            <CardDescription>
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Please check your email, <span className='font-semibold'>{email}</span><br/>inbox (and spam folder) for the password reset link. The link will expire in 1 hour.
                </AlertDescription>
              </Alert>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* <CheckCircle className="h-4 w-4" />
            <p className="text-sm text-muted-foreground">
              Please check your email inbox (and spam folder) for the password reset link. The link will expire in 1 hour.
            </p> */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full"
              >
                Send another email
              </Button>
              <Button
                asChild
                className="w-full bg-highlight-foreground hover:bg-highlight-foreground/90"
              >
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center flex-col p-4 py-20">
      <Card className="w-full max-w-md bg-popover dark:bg-neutral-750 border-stone-500">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
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
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
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
              Send reset link
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

export default ForgotPasswordPage;
