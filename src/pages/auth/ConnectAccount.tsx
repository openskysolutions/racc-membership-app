import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/services/apiClient';

interface ExistingRegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface ContactVerificationResult {
  exists: boolean;
  contact?: {
    id: string;
    email: string;
  };
}

export const ConnectAccountPage = () => {
  const [step, setStep] = useState<'verify' | 'confirm-email' | 'not-found' | 'register'>('verify');
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState(['', '', '', '', '', '']);
  const [verificationResult, setVerificationResult] = useState<ContactVerificationResult | null>(null);
  const [formData, setFormData] = useState<ExistingRegistrationData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailFromUrl, setEmailFromUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract email from URL parameters on component mount
  useEffect(() => {
    // Parse the search string manually to preserve + characters
    const searchString = location.search;
    const emailMatch = searchString.match(/[?&]email=([^&]*)/);
    
    if (emailMatch && emailMatch[1]) {
      // URL decode the email parameter
      const emailParam = decodeURIComponent(emailMatch[1]);
      setEmailFromUrl(emailParam);
      setEmail(emailParam);
      setFormData(prev => ({
        ...prev,
        email: emailParam
      }));
    }
  }, [location.search]);

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
            }));
            setStep('register');
          }
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          // Fallback to direct registration if email service fails
          setFormData(prev => ({
            ...prev,
            email,
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
      const codeString = confirmationCode.join('');
      const response = await apiFetch('/auth/verify-confirmation', {
        method: 'POST',
        body: JSON.stringify({ email, code: codeString })
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
    // If there's an email from URL, keep it; otherwise reset to empty
    if (!emailFromUrl) {
      setEmail('');
    }
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
    <div className="flex items-center justify-center flex-col p-4 pt-24 pb-24">
      {/* <Link
        to="/"
        className="w-full max-w-md p-8 pb-12"
      >
        <img
          src={theme === "dark" ? LogoDark : LogoLight}
          alt="Richfield Area Chamber of Commerce Logo"
          className="w-full"
        />
      </Link> */}
      
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
                  disabled={loading || emailFromUrl !== null}
                  className={emailFromUrl ? "bg-gray-50 dark:bg-gray-800" : ""}
                />
                {/* {emailFromUrl && (
                  <p className="text-sm text-muted-foreground">
                    To use a different email, 
                    <button 
                      type="button"
                      onClick={() => {
                        setEmailFromUrl(null);
                        setEmail('');
                      }}
                      className="ml-1 font-semibold text-highlight-foreground hover:underline"
                    >
                      click here
                    </button>
                  </p>
                )} */}
              </div>
              
              <Button 
                type="submit" 
                className="w-full !mb-6"
                disabled={loading || !email.trim()}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Contact
              </Button>
            </form>
          )}

          {step === 'confirm-email' && (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50 text-blue-800 flex mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className=''>
                  We've sent a confirmation code to: <strong>{email}</strong>. <br/>
                  Please check your inbox and enter the code below.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleEmailConfirmation} className="space-y-4 flex flex-col items-center">
                <div className="space-y-2">
                  <Label className='text-center w-full block'>Confirmation Code</Label>
                  <div className="flex gap-2 justify-center max-w-full">
                    {confirmationCode.map((digit, index) => (
                      <Input
                        key={index}
                        id={`digit-${index}`}
                        type="text"
                        value={digit}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 1) {
                            const newCode = [...confirmationCode];
                            newCode[index] = value;
                            setConfirmationCode(newCode);
                            
                            // Auto-focus next input if digit entered
                            if (value && index < 5) {
                              const nextInput = document.getElementById(`digit-${index + 1}`);
                              nextInput?.focus();
                            }
                          } else if (value.length === 6 && index === 0) {
                            // Handle paste of full 6-digit code
                            const digits = value.split('').slice(0, 6);
                            const newCode = [...digits, '', '', '', '', ''].slice(0, 6);
                            setConfirmationCode(newCode);
                            
                            // Focus the last filled digit
                            const lastFilledIndex = digits.length - 1;
                            if (lastFilledIndex < 5) {
                              setTimeout(() => {
                                const nextInput = document.getElementById(`digit-${lastFilledIndex + 1}`);
                                nextInput?.focus();
                              }, 0);
                            }
                          }
                          if (error) setError(null);
                        }}
                        onKeyDown={(e) => {
                          // Handle backspace navigation
                          if (e.key === 'Backspace' && !confirmationCode[index] && index > 0) {
                            const prevInput = document.getElementById(`digit-${index - 1}`);
                            prevInput?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
                          if (pastedData.length <= 6) {
                            const digits = pastedData.split('');
                            const newCode = [...digits, '', '', '', '', ''].slice(0, 6);
                            setConfirmationCode(newCode);
                            
                            // Focus appropriate input after paste
                            const focusIndex = Math.min(digits.length, 5);
                            setTimeout(() => {
                              const targetInput = document.getElementById(`digit-${focusIndex}`);
                              targetInput?.focus();
                            }, 0);
                          }
                        }}
                        placeholder=""
                        required
                        disabled={loading}
                        maxLength={1}
                        className="w-10 h-10 text-center text-md font-mono"
                        autoFocus={index === 0 && step === 'confirm-email'}
                      />
                    ))}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-[70%] !mb-4 !mt-8"
                  disabled={loading || confirmationCode.some(digit => !digit)}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4  animate-spin" />}
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
                    disabled={loading || emailFromUrl !== null}
                    className={emailFromUrl ? "bg-gray-50 dark:bg-gray-800" : ""}
                  />
                  {emailFromUrl && (
                    <p className="text-sm text-muted-foreground">
                      Email provided from URL. To use a different email, 
                      <button 
                        type="button"
                        onClick={() => {
                          setEmailFromUrl(null);
                          setEmail('');
                        }}
                        className="ml-1 font-semibold text-highlight-foreground hover:underline"
                      >
                        click here
                      </button>
                    </p>
                  )}
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
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder="Create a password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleFormChange}
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3">
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

          <div className="space-y-4 !mb-4 text-center text-sm">
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
                  <Button asChild variant="outline" className="h-auto text-sm font-semibold">
                    <Link 
                  to="/join"
                  className="font-medium text-highlight-foreground"
                >
                      Create a new membership account
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