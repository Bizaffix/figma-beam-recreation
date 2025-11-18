import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

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
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || undefined;

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error, needsConfirmation } = await signUp(email, password, referralCode);
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to sign up",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created",
          description: "Please check your email and click the confirmation link to verify your account before signing in.",
          duration: 10000,
        });
        // Don't redirect - user needs to confirm email first
        // Clear the form
        setEmail("");
        setPassword("");
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
          <CardTitle className="text-2xl text-center">Quilting Retreats</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you'll automatically be assigned the student role
                </p>
              </form>
            </TabsContent>
            
            {/* Resend confirmation email section */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-center text-muted-foreground mb-2">
                Didn't receive the confirmation email?
              </p>
              <ResendConfirmationForm />
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

