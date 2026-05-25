import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVerifyEmailMutation } from "@/services/api/authApi";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const EmailConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifyEmailToken] = useVerifyEmailMutation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');

        if (!token) {
          setStatus('error');
          setMessage('Invalid confirmation link. Please check your email and try again.');
          return;
        }

        await verifyEmailToken({ token }).unwrap();
        setStatus('success');
        setMessage('Email verified successfully! You can now sign in.');
        toast({
          title: "Email Verified",
          description: "Your email has been confirmed. Please sign in to continue.",
        });

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast, verifyEmailToken]);

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

