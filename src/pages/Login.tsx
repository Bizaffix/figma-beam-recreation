import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, Eye, EyeOff } from "lucide-react";
import { consumePostAuthRedirect, setPostAuthRedirect } from "@/lib/post-auth";

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
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="your.email@example.com"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          className="flex-1 h-9 sm:h-10 text-sm"
        />
        <Button type="submit" size="sm" disabled={resendLoading} className="h-9 sm:h-10 text-xs sm:text-sm">
          <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
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
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");

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

        if (nextPath) {
          setPostAuthRedirect(nextPath);
        }
        const redirectPath = consumePostAuthRedirect();
        if (redirectPath && redirectPath !== "/home") {
          navigate(redirectPath);
          return;
        }

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
      
      {/* Mobile Header Banner */}
      <div className="lg:hidden relative bg-gradient-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/90 z-10"></div>
        <div className="relative z-20 px-4 py-8 sm:py-10">
          <div className="max-w-md mx-auto text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
              Welcome Back to Your Quilting Community
            </h2>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed">
              Connect with passionate quilters, discover amazing retreats, and continue your creative journey.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-8 h-0.5 bg-white/50"></div>
              <span className="text-xs sm:text-sm text-white/80">Join thousands of quilters</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-2">
        {/* Desktop Image Section */}
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
        <div className="flex items-center justify-center p-4 sm:p-6 py-6 sm:py-8 md:py-6 lg:py-8 md:p-8 lg:p-12 bg-muted/20 md:bg-background">
          <Card className="w-full max-w-md shadow-lg border md:shadow-xl bg-card">
        <CardHeader className="pb-2 sm:pb-3 md:pb-4">
          <CardTitle className="text-xl sm:text-2xl text-center">Book My Quilt Retreat</CardTitle>
          <CardDescription className="text-center text-xs sm:text-sm md:text-base">
            {showForgotPassword ? "Reset your password" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-3 sm:pb-4 md:pb-6">
          {showForgotPassword ? (
            <>
              {/* Forgot Password Form */}
              <div className="space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="reset-email" className="text-xs sm:text-sm">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base"
                    />
                  </div>
                  <Button type="submit" className="w-full h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base" disabled={resetLoading}>
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                    }}
                    className="w-full text-xs sm:text-sm text-muted-foreground hover:text-foreground py-2"
                  >
                    Back to Sign In
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs sm:text-sm text-primary hover:underline"
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
                      className="pr-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base"
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
                <Button type="submit" className="w-full h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-3 sm:mt-4 md:mt-6 text-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"} className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>

              {/* Resend confirmation email section */}
              <div className="mt-3 sm:mt-4 md:mt-6 pt-3 sm:pt-4 border-t">
                <p className="text-xs sm:text-sm text-center text-muted-foreground mb-2">
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
