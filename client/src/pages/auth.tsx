import { useState, useEffect } from 'react';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Bell, ArrowLeft, Mail, Lock, Briefcase, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import authBackground from '@/assets/auth-background.jpg';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { signIn, signUp, signInWithMagicLink, resetPassword, updatePassword, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'signin' | 'magiclink' | 'reset' | 'signup'>('signin');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: { access_type: 'offline', prompt: 'select_account' },
        },
      });
      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (e) {
      setError('Could not start Google sign-in. Please try again.');
      setGoogleLoading(false);
    }
  };

  const GoogleAuthButton = ({ label }: { label: string }) => (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || isLoading}
        aria-label={label}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
        </svg>
        {googleLoading ? 'Connecting to Google…' : label}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><Separator /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or with email</span>
        </div>
      </div>
    </div>
  );

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: '',
    role: 'supplier' as 'buyer' | 'supplier',
  });

  // Redirect authenticated users (but never during password-recovery)
  useEffect(() => {
    const recoveryInUrl =
      window.location.search.includes('code=') ||
      window.location.search.includes('type=recovery') ||
      window.location.hash.includes('type=recovery') ||
      window.location.hash.includes('access_token');

    if (isAuthenticated && !isPasswordRecovery && !recoveryInUrl) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, isPasswordRecovery, setLocation]);

  // Handle password recovery URL parameters and errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    // Parse hash parameters (Supabase puts tokens in hash)
    const hashString = hash.startsWith('#') ? hash.substring(1) : hash;
    const hashParams = new URLSearchParams(hashString);
    
    // Check for recovery type in hash (from successful email link click)
    const type = urlParams.get('type') || hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    
    // If we have an access token with recovery type, show password reset form
    if (type === 'recovery' && accessToken) {
      console.log('Recovery flow detected with access token');
      setIsPasswordRecovery(true);
      setMessage('Please enter your new password below.');
      // Clean URL but keep Supabase session handling
      window.history.replaceState({}, document.title, '/auth');
      return;
    }
    
    // Check for recovery type without token (fallback)
    if (type === 'recovery') {
      setIsPasswordRecovery(true);
      setMessage('Please enter your new password below.');
      return;
    }
    
    // Check for auth errors (expired link, invalid OTP, etc.)
    const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
    
    if (errorCode === 'otp_expired') {
      setError('Your password reset link has expired. Please request a new one below.');
      setActiveTab('reset');
      window.history.replaceState({}, document.title, '/auth');
    } else if (errorCode === 'access_denied') {
      setError(decodeURIComponent(errorDescription || 'Access denied. Please try again.'));
      setActiveTab('reset');
      window.history.replaceState({}, document.title, '/auth');
    } else if (errorCode) {
      setError(decodeURIComponent(errorDescription || 'An authentication error occurred. Please try again.'));
      setActiveTab('reset');
      window.history.replaceState({}, document.title, '/auth');
    }
  }, []);

  // Supabase PKCE recovery links can arrive as /auth?code=... (no #type=recovery).
  // Supabase will exchange the code and then emit PASSWORD_RECOVERY.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setError(null);
        setActiveTab('signin');
        setIsPasswordRecovery(true);
        setMessage('Please enter your new password below.');
        // Now safe to clean the URL.
        window.history.replaceState({}, document.title, '/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    
    if (!signInData.email || !signInData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const { error } = await signIn(signInData.email, signInData.password);
      
      if (error) {
        setError(error.message);
      } else {
        // Force a clean navigation
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    
    if (!signUpData.email || !signUpData.password || !signUpData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const result = await signUp(signUpData.email, signUpData.password, {
        first_name: signUpData.firstName,
        last_name: signUpData.lastName,
        company: signUpData.company,
        role: signUpData.role,
      });
      
      if (result.error) {
        setError(result.error.message);
      } else {
        setMessage('Check your email for the confirmation link!');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!magicLinkEmail) {
      setError('Please enter your email address');
      return;
    }

    try {
      const { error } = await signInWithMagicLink(magicLinkEmail);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the magic link!');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for password reset instructions!');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Password updated successfully!');
        setIsPasswordRecovery(false);
        setTimeout(() => setLocation('/dashboard'), 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your new password below
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      <SEO title="Sign In or Sign Up — TenderAlert Pro Kenya" description="Create your free TenderAlert Pro account to receive Kenyan tender alerts, AI bid insights and consortium tools." path="/auth" />
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${authBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
        }}
      />
      <div className="absolute inset-0 z-0 bg-slate-900/60 dark:bg-slate-900/80" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">TenderAlert</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Professional Edition</p>
            </div>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </header>

        {/* Auth Form */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md backdrop-blur-md bg-white/95 dark:bg-slate-800/95 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <CardTitle className="text-2xl">Welcome to TenderAlert</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose your preferred authentication method
              </p>
              
              {/* Auth Method Toggle */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={authMethod === 'supabase' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setAuthMethod('supabase')}
                >
                  Email Auth
                </Button>
                <Button
                  variant={authMethod === 'stytch' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setAuthMethod('stytch')}
                >
                  OAuth (Stytch)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {authMethod === 'stytch' ? (
                /* Stytch OAuth Options */
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        setError(null);
                        const result = await initiateOAuth('google');
                        if (!result.success) setError(result.error || 'OAuth failed');
                      }}
                      disabled={stytchLoading}
                    >
                      <Chrome className="h-4 w-4 mr-2" />
                      Continue with Google
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        setError(null);
                        const result = await initiateOAuth('github');
                        if (!result.success) setError(result.error || 'OAuth failed');
                      }}
                      disabled={stytchLoading}
                    >
                      <Github className="h-4 w-4 mr-2" />
                      Continue with GitHub
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        setError(null);
                        const result = await initiateOAuth('microsoft');
                        if (!result.success) setError(result.error || 'OAuth failed');
                      }}
                      disabled={stytchLoading}
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 23 23">
                        <path fill="#f35325" d="M0 0h11v11H0z"/>
                        <path fill="#81bc06" d="M12 0h11v11H12z"/>
                        <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                        <path fill="#ffba08" d="M12 12h11v11H12z"/>
                      </svg>
                      Continue with Microsoft
                    </Button>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Secure OAuth powered by Stytch</p>
                  </div>
                </div>
              ) : (
                /* Supabase Email Auth */
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="signin"><Lock className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="magiclink"><Mail className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="reset">Reset</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <GoogleAuthButton label="Sign in with Google" />
                <form onSubmit={handleSignIn} className="space-y-4" action="#" method="post">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="magiclink">
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">Email</Label>
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="Enter your email"
                      value={magicLinkEmail}
                      onChange={(e) => setMagicLinkEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {message && (
                    <Alert>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Magic Link'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="reset">
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {message && (
                    <Alert>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Reset Password'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <GoogleAuthButton label="Sign up with Google" />
                <form onSubmit={handleSignUp} className="space-y-4" action="#" method="post">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">First Name</Label>
                      <Input
                        id="signup-firstname"
                        placeholder="John"
                        value={signUpData.firstName}
                        onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Last Name</Label>
                      <Input
                        id="signup-lastname"
                        placeholder="Doe"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Company (Optional)</Label>
                    <Input
                      id="signup-company"
                      placeholder="Your company name"
                      value={signUpData.company}
                      onChange={(e) => setSignUpData({ ...signUpData, company: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>I am a:</Label>
                    <RadioGroup 
                      value={signUpData.role} 
                      onValueChange={(value: 'buyer' | 'supplier') => setSignUpData({ ...signUpData, role: value })}
                      className="grid grid-cols-2 gap-4"
                    >
                      <Label
                        htmlFor="role-supplier"
                        className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                          signUpData.role === 'supplier' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value="supplier" id="role-supplier" className="sr-only" />
                        <Briefcase className="h-8 w-8 mb-2 text-primary" />
                        <span className="font-semibold">Supplier</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                          Bid on tenders
                        </span>
                      </Label>
                      <Label
                        htmlFor="role-buyer"
                        className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                          signUpData.role === 'buyer' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value="buyer" id="role-buyer" className="sr-only" />
                        <ShoppingCart className="h-8 w-8 mb-2 text-primary" />
                        <span className="font-semibold">Buyer</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                          Post RFQs
                        </span>
                      </Label>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {message && (
                    <Alert>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}