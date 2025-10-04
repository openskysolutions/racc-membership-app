import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import LogoLight from '@/assets/racc-logo.png';
import LogoDark from '@/assets/racc-logo-dark.png';
import { apiFetch } from '@/services/apiClient';

interface ExistingRegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  // These fields might be pre-populated from GoHighLevel contact
  firstName?: string;
  lastName?: string;
  businessName?: string;
  phone?: string;
  website?: string;
}

interface ContactVerificationResult {
  exists: boolean;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    businessName?: string;
    website?: string;
  };
}

export const ConnectAccountPage = () => {
  const [step, setStep] = useState<'verify' | 'confirm-email' | 'not-found' | 'register'>('verify');
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<ContactVerificationResult | null>(null);
  const [formData, setFormData] = useState<ExistingRegistrationData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiFetch(`/auth/verify-contact`, {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 409) {
          // Account already exists
          setError(errorData.message || 'An account with this email already exists. Please sign in instead.');
          return;
        }
        
        if (response.status === 400) {
          // Invalid email format
          setError('Please enter a valid email address.');
          return;
        }
        
        if (response.status === 500) {
          // Server error or GoHighLevel API issues
          setError(errorData.message || 'Service temporarily unavailable. Please try again in a few moments.');
          return;
        }
        
        // Generic error for other issues
        setError('Unable to verify your email at this time. Please try again.');
        return;
      }

      const result: ContactVerificationResult = await response.json();
      setVerificationResult(result);
      
      if (result.exists && result.contact) {
        // Contact found - send confirmation email before proceeding
        try {
          const confirmResponse = await apiFetch('/auth/send-confirmation', {
            method: 'POST',
            body: JSON.stringify({ email })
          });
          
          if (confirmResponse.ok) {
            setStep('confirm-email');
          } else {
            // If email sending fails, still allow them to proceed (fallback)
            setFormData(prev => ({
              ...prev,
              email,
              firstName: result.contact?.firstName || '',
              lastName: result.contact?.lastName || '',
              businessName: result.contact?.businessName || '',
              phone: result.contact?.phone || '',
              website: result.contact?.website || ''
            }));
            setStep('register');
          }
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          // Fallback to direct registration if email service fails
          setFormData(prev => ({
            ...prev,
            email,
            firstName: result.contact?.firstName || '',
            lastName: result.contact?.lastName || '',
            businessName: result.contact?.businessName || '',
            phone: result.contact?.phone || '',
            website: result.contact?.website || ''
          }));
          setStep('register');
        }
      } else {
        // No contact found - show not found step
        setStep('not-found');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError('Unable to verify your email at this time. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiFetch('/auth/verify-confirmation', {
        method: 'POST',
        body: JSON.stringify({ email, code: confirmationCode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid confirmation code. Please try again.');
        return;
      }

      // Confirmation successful - pre-populate form and proceed to registration
      if (verificationResult?.contact) {
        setFormData(prev => ({
          ...prev,
          email,
          firstName: verificationResult.contact?.firstName || '',
          lastName: verificationResult.contact?.lastName || '',
          businessName: verificationResult.contact?.businessName || '',
          phone: verificationResult.contact?.phone || '',
          website: verificationResult.contact?.website || ''
        }));
      }
      setStep('register');
    } catch (err: any) {
      console.error('Confirmation error:', err);
      setError('Unable to verify confirmation code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await apiFetch('/auth/send-confirmation', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setSuccess('Confirmation email sent! Please check your inbox.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Unable to send confirmation email. Please try again.');
      }
    } catch (err) {
      setError('Unable to send confirmation email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate password strength
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const registrationPayload = {
        ...formData,
        existingContactId: verificationResult?.contact?.id || null,
        isExistingContact: verificationResult?.exists || false
      };

      const response = await apiFetch('/auth/register-existing', {
        method: 'POST',
        body: JSON.stringify(registrationPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      setSuccess('Registration successful! You can now sign in with your credentials.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { 
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError(null);
  };

  const handleTryAgain = () => {
    setStep('verify');
    setError(null);
    setVerificationResult(null);
  };

  const getStepTitle = () => {
    switch (step) {
      case 'verify':
        return 'Connect Your Membership';
      case 'confirm-email':
        return 'Check Your Email';
      case 'not-found':
        return 'Email Not Found';
      case 'register':
        return 'Complete Registration';
      default:
        return 'Verify Your Contact';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'verify':
        return 'Enter your email to connect your existing membership';
      case 'confirm-email':
        return '';
      case 'not-found':
        return '';
      case 'register':
        return verificationResult?.exists 
          ? 'We found your contact record! Complete your registration below.'
          : 'Complete your registration below.';
      default:
        return 'Enter your email to check if you have an existing contact record with us';
    }
  };

  return (
    <div className="flex items-center justify-center flex-col p-8 pb-36">
      <Link
        to="/"
        className="w-full max-w-md p-8 pb-12"
      >
        <img
          src={theme === "dark" ? LogoDark : LogoLight}
          alt="Richfield Area Chamber of Commerce Logo"
          className="w-full"
        />
      </Link>
      
      <Card className="w-full max-w-md bg-popover dark:bg-neutral-750 border-stone-500">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            {getStepTitle()}
          </CardTitle>
          <CardDescription>
            {getStepDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {step === 'verify' && (
            <form onSubmit={handleEmailVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !email.trim()}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Contact
              </Button>
            </form>
          )}

          {step === 'confirm-email' && (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  We've sent a confirmation code to: <strong>{email}</strong>. <br/>
                  Please check your inbox and enter the code below. Or, {' '}
                  <span onClick={handleTryAgain} className="font-semibold cursor-pointer">try a different email</span>
                </AlertDescription>
              </Alert>

              <form onSubmit={handleEmailConfirmation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmation-code">Confirmation Code</Label>
                  <Input
                    id="confirmation-code"
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => {
                      setConfirmationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (error) setError(null);
                    }}
                    placeholder="Enter 6-digit code"
                    required
                    disabled={loading}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading || confirmationCode.length !== 6}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Code
                </Button>
              </form>
              
              <div className="text-center flex flex-col gap-2">
                <span className="text-sm text-muted-foreground mb-2">
                Didn't receive the code? {' '}
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="font-semibold text-highlight-foreground hover:underline"
                >
                  Resend email
                </button>
                </span>
              </div>
            </div>
          )}

          {step === 'not-found' && (
            <div className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  We couldn't find a contact record for this email address in our system. Please double-check your email or create a new account.
                </AlertDescription>
              </Alert>
              
              <form onSubmit={handleEmailVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-retry">Email Address</Label>
                  <Input
                    id="email-retry"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter your email address"
                    required
                    disabled={loading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading || !email.trim()}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Try Again
                </Button>
              </form>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Don't have a contact record with us yet?
                </p>
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                >
                  Create New Account
                </Link>
              </div>
            </div>
          )}

          {step === 'register' && verificationResult && (
            <>
              {verificationResult.exists && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Contact found in our system! Some fields have been pre-filled for you.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleRegistration} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName || ''}
                      onChange={handleFormChange}
                      placeholder="First Name"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName || ''}
                      onChange={handleFormChange}
                      placeholder="Last Name"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled={true}
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName || ''}
                    onChange={handleFormChange}
                    placeholder="Your Business Name"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={handleFormChange}
                    placeholder="(555) 123-4567"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website || ''}
                    onChange={handleFormChange}
                    placeholder="https://yourbusiness.com"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder="Create a password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleFormChange}
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleTryAgain}
                    disabled={loading}
                    className="w-full"
                  >
                    Back to Email
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Complete Registration
                  </Button>
                </div>
              </form>
            </>
          )}

          <div className="space-y-2 text-center text-sm">
            {step !== 'not-found' && (
              <>
                <div>
                  Already have an account?{' '}
                  <Link to="/login" 
                className="font-semibold text-highlight-foreground hover:underline"
              >
                    Sign in
                  </Link>
                </div>
                <div>
                  <Button asChild variant="ghost" className="h-auto text-sm font-semibold">
                    <Link 
                  to="/register"
                  className="font-medium text-highlight-foreground hover:underline"
                >
                      Create new account
                    </Link>
                  </Button>
                </div>
              </>
            )}
            {step === 'not-found' && (
              <div>
                Already have an account?{' '}
                <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                  Sign in here
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectAccountPage;