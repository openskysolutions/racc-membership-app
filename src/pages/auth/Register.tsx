import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTheme } from '@/providers/theme-provider';
import LogoLight from '@/assets/racc-logo.png';
import LogoDark from '@/assets/racc-logo-dark.png';

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterPage = () => {
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Please enter a valid email address';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Registration successful! You can now sign in with your credentials.');
      
      // Clear form
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth', { 
          state: { 
            message: 'Registration successful! Please sign in.',
            email: formData.email 
          }
        });
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
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
          <CardTitle className="text-2xl">Join the Richfield Area Chamber of Commerce</CardTitle>
          <CardDescription>
            Create your account to become a member of our business community
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4" variant="default">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-highlight-foreground"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-sm text-center pt-4 space-y-2">
              <div>
                <span>Already have an account? </span>
                <Link 
                  to="/login" 
                  className="font-medium text-highlight-foreground hover:underline"
                >
                  Sign in
                </Link>
              </div>
              <div>
                <span>Already a member? </span>
                <Link 
                  to="/register-existing" 
                  className="font-medium text-highlight-foreground hover:underline"
                >
                  Connect your account
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;