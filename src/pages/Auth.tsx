import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, Mail, Lock, ArrowLeft, Loader2, Phone, Gift } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number');

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [referralId, setReferralId] = useState(searchParams.get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; mobile?: string }>({});

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors: { email?: string; password?: string; mobile?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (isSignUp && mobileNumber) {
      try {
        mobileSchema.parse(mobileNumber);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.mobile = e.errors[0].message;
        }
      }
    }

    if (isSignUp && !mobileNumber) {
      newErrors.mobile = 'Mobile number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);

    try {
      if (isSignUp) {
        // Check if email already exists
        const { data: existingProfiles } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', email.toLowerCase().trim())
          .limit(1);
        
        if (existingProfiles && existingProfiles.length > 0) {
          toast({
            title: 'Account exists',
            description: 'This email is already registered. Please sign in.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please sign in.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          // After signup, update profile with mobile number and referral
          const { data: { user: newUser } } = await supabase.auth.getUser();
          
          if (newUser) {
            // Update profile with mobile number
            await supabase
              .from('profiles')
              .update({ 
                mobile_number: mobileNumber,
                referred_by: referralId || null
              })
              .eq('user_id', newUser.id);

            // Wallet is provisioned server-side on sign-up; ensure it exists.
            await supabase.rpc('ensure_wallet');


            // Process referral if provided
            if (referralId && referralId !== mobileNumber) {
              await supabase.rpc('process_referral', {
                p_referred_user_id: newUser.id,
                p_referred_mobile: mobileNumber,
                p_referrer_mobile: referralId
              });
            }
          }

          toast({
            title: 'Account created!',
            description: 'You can now access your dashboard. ₹100 welcome bonus added!',
          });
          navigate('/dashboard');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Sign in failed',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive',
          });
        } else {
          navigate('/dashboard');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mx-auto mb-4 shadow-glow">
              <FileText className="w-7 h-7 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-2xl">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Start generating your internship reports' 
                : 'Sign in to continue to your dashboard'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="9876543210"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="pl-10"
                        disabled={loading}
                        maxLength={10}
                      />
                    </div>
                    {errors.mobile && (
                      <p className="text-sm text-destructive">{errors.mobile}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referral">Referral ID (Optional)</Label>
                    <div className="relative">
                      <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="referral"
                        type="tel"
                        placeholder="Friend's mobile number"
                        value={referralId}
                        onChange={(e) => setReferralId(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="pl-10"
                        disabled={loading}
                        maxLength={10}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter your friend's mobile number to get referral benefits
                    </p>
                  </div>
                </>
              )}

              <Button
                type="submit" 
                variant="gradient" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:underline font-medium"
                  type="button"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

            <p className="mt-6 text-xs text-muted-foreground text-center">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
