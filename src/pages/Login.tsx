import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, Eye, EyeOff } from "lucide-react";

const ResendConfirmationForm = () => {
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const { resendConfirmationEmail } = useAuth();
  const { toast } = useToast();

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await resendConfirmationEmail(resendEmail);
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to resend confirmation email",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email Sent",
          description: "Confirmation email has been resent. Please check your inbox.",
          duration: 8000,
        });
        setResendEmail("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form onSubmit={handleResend} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your.email@example.com"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={resendLoading}>
          <Mail className="w-4 h-4 mr-2" />
          {resendLoading ? "Sending..." : "Resend"}
        </Button>
      </div>
    </form>
  );
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error, role, needsConfirmation } = await signIn(email, password);
      if (error) {
        toast({
          title: needsConfirmation ? "Email Not Verified" : "Error",
          description: error.message || "Failed to sign in",
          variant: "destructive",
          duration: needsConfirmation ? 8000 : 5000,
        });
      } else {
        toast({
          title: "Success",
          description: "Signed in successfully",
        });
        // Redirect based on role
        if (role === 'instructor') {
          navigate("/instructor/dashboard");
        } else {
          navigate("/home");
        }
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to send password reset email",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email Sent",
          description: "Password reset link has been sent to your email. Please check your inbox.",
          duration: 8000,
        });
        setResetEmail("");
        setShowForgotPassword(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Image Section */}
        <div className="hidden lg:flex relative bg-gradient-primary overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/90 z-10"></div>
          <img 
            src="/Image2.jpg" 
            alt="Quilting retreat" 
            className="w-full h-full object-cover mix-blend-overlay"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-white">
            <div className="max-w-md space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                Welcome Back to Your Quilting Community
              </h2>
              <p className="text-lg text-white/90 leading-relaxed">
                Connect with passionate quilters, discover amazing retreats, and continue your creative journey.
              </p>
              <div className="flex items-center gap-2 pt-4">
                <div className="w-12 h-0.5 bg-white/50"></div>
                <span className="text-sm text-white/80">Join thousands of quilters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex items-center justify-center p-6 py-12 lg:p-12">
          <Card className="w-full max-w-md shadow-lg border-0 lg:shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Quilting Retreats</CardTitle>
          <CardDescription className="text-center">
            {showForgotPassword ? "Reset your password" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <>
              {/* Forgot Password Form */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={resetLoading}>
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                    }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                  >
                    Back to Sign In
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
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
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>

              {/* Resend confirmation email section */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-center text-muted-foreground mb-2">
                  Didn't receive the confirmation email?
                </p>
                <ResendConfirmationForm />
              </div>
            </>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
