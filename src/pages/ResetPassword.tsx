import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<'checking' | 'ready' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Verifying reset link...');
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkResetLink = async () => {
      try {
        // Check if we have hash fragments (Supabase password reset redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        // Also check query parameters
        const token = searchParams.get('token');
        const queryType = searchParams.get('type');

        // Supabase automatically processes hash fragments when the page loads
        // We need to wait a bit for the session to be established
        if (accessToken || (hashParams.has('access_token') && hashParams.has('refresh_token'))) {
          // Wait for Supabase to process the hash and create a session
          setTimeout(async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Reset link verification error:', error);
              setStatus('error');
              setMessage(error.message || 'Invalid or expired reset link. Please request a new password reset.');
              return;
            }

            if (session) {
              // Valid reset link - user can now set new password
              setStatus('ready');
              setMessage('Please enter your new password');
              // Clear the hash from URL
              window.history.replaceState({}, document.title, window.location.pathname);
            } else {
              setStatus('error');
              setMessage('Invalid or expired reset link. Please request a new password reset.');
            }
          }, 1000);
        } else if (token && (queryType === 'recovery' || type === 'recovery')) {
          // Handle OTP-based password reset
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          });

          if (error) {
            console.error('Reset link verification error:', error);
            setStatus('error');
            setMessage(error.message || 'Invalid or expired reset link. Please request a new password reset.');
          } else {
            setStatus('ready');
            setMessage('Please enter your new password');
          }
        } else {
          // Check if there's already a session (user might have clicked link elsewhere)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setStatus('ready');
            setMessage('Please enter your new password');
          } else {
            // No valid reset parameters
            setStatus('error');
            setMessage('Invalid reset link. Please request a new password reset from the login page.');
          }
        }
      } catch (error) {
        console.error('Error checking reset link:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    checkResetLink();
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to update password",
          variant: "destructive",
        });
      } else {
        setStatus('success');
        setMessage('Password updated successfully! You can now sign in.');
        toast({
          title: "Password Updated",
          description: "Your password has been updated. Please sign in with your new password.",
        });
        
        // Sign out the user (they were auto-signed in by Supabase)
        await supabase.auth.signOut();
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            {status === 'checking' && 'Verifying reset link...'}
            {status === 'ready' && 'Set your new password'}
            {status === 'success' && 'Password updated'}
            {status === 'error' && 'Reset failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'checking' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating password..." : "Update Password"}
              </Button>
            </form>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-center text-muted-foreground">{message}</p>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Redirecting to login...
              </p>
              <Button
                className="w-full mt-4"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="w-16 h-16 text-destructive mb-4" />
              <p className="text-center text-muted-foreground">{message}</p>
              <Button
                className="w-full mt-4"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;

