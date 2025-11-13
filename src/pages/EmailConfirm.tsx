import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const EmailConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if we have hash fragments (Supabase email confirmation redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        // Also check query parameters (for OTP verification)
        const token = searchParams.get('token');
        const queryType = searchParams.get('type');

        // Supabase automatically processes hash fragments when the page loads
        // We need to wait a bit for the session to be established
        if (accessToken || (hashParams.has('access_token') && hashParams.has('refresh_token'))) {
          // Wait for Supabase to process the hash and create a session
          // Check session after a short delay
          setTimeout(async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Email verification error:', error);
              setStatus('error');
              setMessage(error.message || 'Failed to verify email. The link may have expired.');
              return;
            }

            if (session) {
              setStatus('success');
              setMessage('Email verified successfully! You can now sign in.');
              toast({
                title: "Email Verified",
                description: "Your email has been confirmed. You can now sign in.",
              });
              
              // Clear the hash from URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Redirect to login after 2 seconds
              setTimeout(() => {
                navigate('/login');
              }, 2000);
            } else {
              setStatus('error');
              setMessage('Failed to verify email. The link may have expired.');
            }
          }, 1000);
        } else if (token && (queryType || type)) {
          // Handle OTP-based verification
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: (queryType || type) as 'email',
          });

          if (error) {
            console.error('Email verification error:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to verify email. The link may have expired.');
          } else {
            setStatus('success');
            setMessage('Email verified successfully! You can now sign in.');
            toast({
              title: "Email Verified",
              description: "Your email has been confirmed. You can now sign in.",
            });
            
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
        } else {
          // Check if there's already a session (user might have confirmed elsewhere)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setStatus('success');
            setMessage('Email already verified! You can sign in.');
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else {
            // No valid confirmation parameters
            setStatus('error');
            setMessage('Invalid confirmation link. Please check your email and try again.');
          }
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' && 'Please wait...'}
            {status === 'success' && 'Verification complete'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                <p className="text-center text-muted-foreground">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <p className="text-center text-muted-foreground">{message}</p>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Redirecting to login...
                </p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 text-destructive mb-4" />
                <p className="text-center text-muted-foreground">{message}</p>
              </>
            )}
          </div>

          {status === 'error' && (
            <Button
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          )}

          {status === 'success' && (
            <Button
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirm;

