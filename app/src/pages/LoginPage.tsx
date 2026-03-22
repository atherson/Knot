import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Mail, Lock, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith('@usiu.ac.ke')) {
      toast.error('Please use a valid student email (@usiu.ac.ke)');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.requestOTP(email);
      toast.success('Verification code sent to your email!');
      setStep('otp');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authAPI.verifyOTP(email, otp);
      login(response.data.token, response.data.user);
      toast.success('Welcome to CampusConnect!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await authAPI.requestOTP(email);
      toast.success('New verification code sent!');
      setCountdown(60);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-green-50 p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-orange shadow-xl shadow-orange-500/20 mb-4 float">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CampusConnect</h1>
          <p className="text-gray-500">Connect with your campus community</p>
        </div>

        <Card className="border-0 shadow-2xl shadow-orange-500/10 bg-white/80 backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {step === 'email' ? 'Welcome Back' : 'Verify Email'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 'email' 
                ? 'Enter your student email to continue' 
                : `Enter the 6-digit code sent to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Student Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 input-focus"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Must be a valid .edu email address
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 gradient-orange text-white font-semibold btn-press"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="pl-10 h-12 text-center tracking-[0.5em] text-lg font-mono input-focus"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 gradient-orange text-white font-semibold btn-press"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Verify
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isLoading}
                    className="text-sm text-orange-600 hover:text-orange-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 
                      ? `Resend code in ${countdown}s` 
                      : 'Resend code'}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Use different email
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 text-lg">💬</span>
            </div>
            <p className="text-xs text-gray-600">Connect</p>
          </div>
          <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 text-lg">📚</span>
            </div>
            <p className="text-xs text-gray-600">Learn</p>
          </div>
          <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <span className="text-purple-600 text-lg">🤝</span>
            </div>
            <p className="text-xs text-gray-600">Collaborate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
