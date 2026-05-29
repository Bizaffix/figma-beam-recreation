import { useState, type FormEvent } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail } from "lucide-react";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { redirectAfterAuth, setPostAuthRedirect } from "@/lib/post-auth";
import { buildGoogleOAuthStartUrl } from "@/lib/google-oauth";

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
    } catch {
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
          className="flex-1 h-10 text-sm border-border bg-background"
        />
        <Button type="submit" size="sm" disabled={resendLoading} variant="outline" className="h-10 shrink-0">
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");

  const redirectAfterSignIn = (role: string | undefined) => {
    if (nextPath) {
      setPostAuthRedirect(nextPath);
    }
    redirectAfterAuth(navigate, role);
  };

  const handleSubmit = async (e: FormEvent) => {
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
        redirectAfterSignIn(role);
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    if (nextPath) {
      setPostAuthRedirect(nextPath);
    }
    setGoogleLoading(true);
    window.location.href = buildGoogleOAuthStartUrl();
  };

  const signupHref = nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup";

  return (
    <div className="min-h-screen bg-background quilt-match-home text-foreground">
      <QuiltMatchSiteHeader />
      <main className="max-w-md mx-auto px-6 py-20">
        <h1 className="font-display text-4xl mb-2">Welcome back</h1>
        <p className="text-muted-foreground mb-10">Sign in to continue.</p>

        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={googleLoading}
          className="w-full border border-border py-3 text-sm font-medium hover:bg-accent transition-colors mb-6 disabled:opacity-50"
        >
          {googleLoading ? "Continuing…" : "Continue with Google"}
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="login-password" className="text-xs uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-rust border-b border-rust/30 hover:border-rust">
                Forgot?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground mt-8 text-center">
          New to QuiltMatch?{" "}
          <Link to={signupHref} className="text-rust border-b border-rust/30 hover:border-rust">
            Create an account
          </Link>
        </p>

        <div className="mt-10 pt-8 border-t border-border">
          <p className="text-xs text-center text-muted-foreground mb-3">Didn&apos;t receive the confirmation email?</p>
          <ResendConfirmationForm />
        </div>
      </main>
    </div>
  );
};

export default Login;
