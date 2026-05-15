import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: "Error",
          description: error.message ?? "Could not send reset email.",
          variant: "destructive",
        });
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background quilt-match-home text-foreground">
      <QuiltMatchSiteHeader />
      <main className="max-w-md mx-auto px-6 py-20">
        <h1 className="font-display text-4xl mb-2">Reset your password</h1>
        <p className="text-muted-foreground mb-10">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>

        {sent ? (
          <div className="border border-border p-6 text-sm">
            <p className="mb-2">Check your inbox.</p>
            <p className="text-muted-foreground">
              If an account exists for <span className="text-foreground">{email}</span>, a reset link is on
              its way.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-sm text-muted-foreground mt-8 text-center">
          <Link to="/login" className="text-rust border-b border-rust/30 hover:border-rust">
            Back to sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
