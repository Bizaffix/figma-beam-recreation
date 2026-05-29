import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { INSTRUCTOR_AGREEMENT } from "@/content/instructor-agreement";
import { PRIVACY_POLICY } from "@/content/privacy-policy";
import { STUDENT_TERMS_AND_CONDITIONS } from "@/content/student-terms-and-conditions";
import { STUDENT_PRIVACY_POLICY } from "@/content/student-privacy-policy";
import { createReferral, getCurrentAffiliate } from "@/lib/affiliate-tracking";
import { buildGoogleOAuthStartUrl } from "@/lib/google-oauth";
import { setPostAuthRedirect } from "@/lib/post-auth";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";

type SignupRole = "student" | "instructor" | "location_owner";

const ROLE_CARDS: {
  id: SignupRole;
  eyebrow: string;
  title: string;
  copy: string;
  color: string;
}[] = [
  {
    id: "student",
    eyebrow: "For the Maker",
    title: "I'm a Quilter",
    copy: "Discover retreats, book seats, and share projects.",
    color: "text-sage",
  },
  {
    id: "instructor",
    eyebrow: "For the Host",
    title: "I'm a Creator",
    copy: "Run workshops, fill seats, and grow your following.",
    color: "text-rust",
  },
  {
    id: "location_owner",
    eyebrow: "For the Space",
    title: "I'm a Venue",
    copy: "List your space, post open weeks, fill the calendar.",
    color: "text-match-indigo",
  },
];

const inputClass =
  "w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SignupRole | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showStudentTermsDialog, setShowStudentTermsDialog] = useState(false);
  const [showStudentPrivacyDialog, setShowStudentPrivacyDialog] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || undefined;
  const roleParam = searchParams.get("role");
  const intent = searchParams.get("intent");
  const plan = searchParams.get("plan");
  const nextPath = searchParams.get("next");
  const isQuiltMatchSignup = intent === "quiltmatch_ai";
  const { settings: platformSettings } = usePlatformSettings();
  const aiMonthlyPrice = platformSettings?.ai_subscription_monthly_price ?? Number(plan || 3.99);

  useEffect(() => {
    if (roleParam === "student" || roleParam === "instructor" || roleParam === "location_owner") {
      setSelectedRole(roleParam);
    }
  }, [roleParam]);

  useEffect(() => {
    if (isQuiltMatchSignup) {
      setSelectedRole("student");
    }
  }, [isQuiltMatchSignup]);

  useEffect(() => {
    if (nextPath) {
      setPostAuthRedirect(nextPath);
    }
  }, [nextPath]);

  const splitDisplayName = (): { firstName: string; lastName: string } | null => {
    const trimmed = displayName.trim().replace(/\s+/g, " ");
    const parts = trimmed.split(" ");
    if (parts.length < 2) {
      toast({
        title: "Error",
        description: "Please enter your first and last name.",
        variant: "destructive",
      });
      return null;
    }
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  };

  const handleGoogle = () => {
    if (!selectedRole) return;

    if (selectedRole === "instructor" || selectedRole === "student" || selectedRole === "location_owner") {
      if (!agreedToTerms || !agreedToPrivacy) {
        toast({
          title: "Error",
          description: "Please read and agree to the terms and privacy policy before continuing.",
          variant: "destructive",
        });
        return;
      }
    }

    if (nextPath) {
      setPostAuthRedirect(nextPath);
    }

    setGoogleLoading(true);
    window.location.href = buildGoogleOAuthStartUrl({ from: "signup" });
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    const names = splitDisplayName();
    if (!names) return;

    const { firstName, lastName } = names;

    if (selectedRole === "instructor") {
      if (!agreedToTerms || !agreedToPrivacy) {
        toast({
          title: "Error",
          description:
            "Please read and agree to the Instructor Terms of Service and Privacy Policy",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedRole === "student") {
      if (!agreedToTerms || !agreedToPrivacy) {
        toast({
          title: "Error",
          description:
            "Please read and agree to the Participant Terms and Conditions and Privacy Policy",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedRole === "location_owner") {
      if (!agreedToTerms || !agreedToPrivacy) {
        toast({
          title: "Error",
          description:
            "Please read and agree to the Participant Terms and Conditions and Privacy Policy",
          variant: "destructive",
        });
        return;
      }
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const studentData = { firstName: firstName.trim(), lastName: lastName.trim() };

      const instructorData =
        selectedRole === "instructor"
          ? {
              ...studentData,
              bio: bio.trim(),
            }
          : undefined;

      const locationOwnerData = selectedRole === "location_owner" ? { ...studentData } : undefined;

      const result = await signUp(
        email,
        password,
        selectedRole,
        referralCode,
        studentData,
        instructorData,
        locationOwnerData,
      );
      const { error, needsConfirmation, data: signupData } = result as {
        error: { message?: string } | null;
        needsConfirmation?: boolean;
        data?: { user?: { id: string } };
      };

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to sign up",
          variant: "destructive",
        });
      } else {
        const affiliateData = getCurrentAffiliate();
        if (affiliateData && signupData?.user?.id) {
          try {
            const referralType =
              selectedRole === "instructor"
                ? "organizer"
                : selectedRole === "location_owner"
                  ? "venue"
                  : "student";
            await createReferral(referralType, signupData.user.id);
          } catch (affiliateError) {
            console.error("Error creating affiliate referral:", affiliateError);
          }
        }

        toast({
          title: "Account Created",
          description: isQuiltMatchSignup
            ? "Please verify your email, then sign in to continue your QuiltMatch AI subscription setup."
            : needsConfirmation === false
              ? "You’re signed in."
              : "Please check your email and click the confirmation link to verify your account before signing in.",
          duration: 10000,
        });

        setEmail("");
        setPassword("");
        setSelectedRole("student");
        setDisplayName("");
        setBio("");
        setAgreedToTerms(false);
        setAgreedToPrivacy(false);
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

  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  const termsBlock =
    selectedRole === "instructor" ? (
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms-agreement"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            className="mt-0.5"
          />
          <Label htmlFor="terms-agreement" className="text-xs font-normal cursor-pointer leading-relaxed">
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={() => setShowTermsDialog(true)}
              className="text-rust border-b border-rust/30 hover:border-rust"
            >
              Instructor Terms of Service
            </button>
          </Label>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="privacy-agreement"
            checked={agreedToPrivacy}
            onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
            className="mt-0.5"
          />
          <Label htmlFor="privacy-agreement" className="text-xs font-normal cursor-pointer leading-relaxed">
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={() => setShowPrivacyDialog(true)}
              className="text-rust border-b border-rust/30 hover:border-rust"
            >
              Privacy Policy
            </button>
          </Label>
        </div>
      </div>
    ) : selectedRole === "student" ? (
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-start gap-2">
          <Checkbox
            id="student-terms-agreement"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            className="mt-0.5"
          />
          <Label htmlFor="student-terms-agreement" className="text-xs font-normal cursor-pointer leading-relaxed">
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={() => setShowStudentTermsDialog(true)}
              className="text-rust border-b border-rust/30 hover:border-rust"
            >
              Participant Terms and Conditions
            </button>
          </Label>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="student-privacy-agreement"
            checked={agreedToPrivacy}
            onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
            className="mt-0.5"
          />
          <Label htmlFor="student-privacy-agreement" className="text-xs font-normal cursor-pointer leading-relaxed">
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={() => setShowStudentPrivacyDialog(true)}
              className="text-rust border-b border-rust/30 hover:border-rust"
            >
              Privacy Policy
            </button>
          </Label>
        </div>
      </div>
    ) : selectedRole === "location_owner" ? (
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-start gap-2">
          <Checkbox
            id="venue-terms-agreement"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            className="mt-0.5"
          />
          <Label htmlFor="venue-terms-agreement" className="text-xs font-normal cursor-pointer leading-relaxed">
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={() => setShowStudentTermsDialog(true)}
              className="text-rust border-b border-rust/30 hover:border-rust"
            >
              Participant Terms and Conditions
            </button>
          </Label>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="venue-privacy-agreement"
            checked={agreedToPrivacy}
            onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
            className="mt-0.5"
          />
          <Label htmlFor="venue-privacy-agreement" className="text-xs font-normal cursor-pointer leading-relaxed">
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={() => setShowStudentPrivacyDialog(true)}
              className="text-rust border-b border-rust/30 hover:border-rust"
            >
              Privacy Policy
            </button>
          </Label>
        </div>
      </div>
    ) : null;

  const submitDisabled =
    loading ||
    !selectedRole ||
    (selectedRole === "student" && (!agreedToTerms || !agreedToPrivacy)) ||
    (selectedRole === "instructor" && (!agreedToTerms || !agreedToPrivacy)) ||
    (selectedRole === "location_owner" && (!agreedToTerms || !agreedToPrivacy));

  return (
    <div className="min-h-screen bg-background quilt-match-home text-foreground">
      <QuiltMatchSiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-16">
        {isQuiltMatchSignup && (
          <div className="mb-8 rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-rust mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">QuiltMatch AI subscription</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your account to unlock QuiltMatch AI for ${aiMonthlyPrice.toFixed(2)}/month.
                </p>
              </div>
            </div>
          </div>
        )}

        <h1 className="font-display text-4xl mb-2">Join QuiltMatch</h1>
        <p className="text-muted-foreground mb-10">
          Tell us how you&apos;ll use the platform. You can add more roles later.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {ROLE_CARDS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setSelectedRole(r.id);
                setAgreedToTerms(false);
                setAgreedToPrivacy(false);
              }}
              disabled={isQuiltMatchSignup && r.id !== "student"}
              className={`text-left p-6 border transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                selectedRole === r.id
                  ? "border-foreground bg-accent/30"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <span className={`font-mono text-[10px] uppercase tracking-widest ${r.color} block mb-3`}>
                {r.eyebrow}
              </span>
              <h2 className="font-display text-xl mb-2">{r.title}</h2>
              <p className="text-sm text-muted-foreground">{r.copy}</p>
            </button>
          ))}
        </div>

        {selectedRole && (
          <>
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

            <form onSubmit={(e) => void handleSignUp(e)} className="space-y-4 max-w-md">
              <div>
                <label
                  htmlFor="signup-name"
                  className="text-xs uppercase tracking-widest text-muted-foreground block mb-2"
                >
                  Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="First Last"
                  className={inputClass}
                />
              </div>

              {selectedRole === "instructor" && (
                <div>
                  <label htmlFor="signup-bio" className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                    Bio <span className="normal-case text-muted-foreground">(optional)</span>
                  </label>
                  <Textarea
                    id="signup-bio"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className={`${inputClass} min-h-[88px] resize-y`}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="signup-email"
                  className="text-xs uppercase tracking-widest text-muted-foreground block mb-2"
                >
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="text-xs uppercase tracking-widest text-muted-foreground block mb-2"
                >
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground mt-2">At least 8 characters.</p>
              </div>

              {termsBlock}

              <button
                type="submit"
                disabled={submitDisabled}
                className="w-full btn-primary py-3 text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
          </>
        )}

        <p className="text-sm text-muted-foreground mt-8">
          Already have an account?{" "}
          <Link to={loginHref} className="text-rust border-b border-rust/30 hover:border-rust">
            Sign in
          </Link>
        </p>
      </main>

      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>{INSTRUCTOR_AGREEMENT.title}</DialogTitle>
            <DialogDescription>
              {INSTRUCTOR_AGREEMENT.company} • Effective Date: {INSTRUCTOR_AGREEMENT.effectiveDate}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="pr-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {INSTRUCTOR_AGREEMENT.content}
              </pre>
            </div>
          </div>
          <div className="flex justify-end pt-4 pb-6 px-6 border-t flex-shrink-0">
            <Button type="button" onClick={() => setShowTermsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showStudentTermsDialog} onOpenChange={setShowStudentTermsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>{STUDENT_TERMS_AND_CONDITIONS.title}</DialogTitle>
            <DialogDescription>
              {STUDENT_TERMS_AND_CONDITIONS.company} • Last Updated: {STUDENT_TERMS_AND_CONDITIONS.lastUpdated}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="pr-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {STUDENT_TERMS_AND_CONDITIONS.content}
              </pre>
            </div>
          </div>
          <div className="flex justify-end pt-4 pb-6 px-6 border-t flex-shrink-0">
            <Button type="button" onClick={() => setShowStudentTermsDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showStudentPrivacyDialog} onOpenChange={setShowStudentPrivacyDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>{STUDENT_PRIVACY_POLICY.title}</DialogTitle>
            <DialogDescription>
              {STUDENT_PRIVACY_POLICY.company} • Last Updated: {STUDENT_PRIVACY_POLICY.lastUpdated}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="pr-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {STUDENT_PRIVACY_POLICY.content}
              </pre>
            </div>
          </div>
          <div className="flex justify-end pt-4 pb-6 px-6 border-t flex-shrink-0">
            <Button type="button" onClick={() => setShowStudentPrivacyDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>{PRIVACY_POLICY.title}</DialogTitle>
            <DialogDescription>
              {PRIVACY_POLICY.company} • Last Updated: {PRIVACY_POLICY.lastUpdated}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="pr-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {PRIVACY_POLICY.content}
              </pre>
            </div>
          </div>
          <div className="flex justify-end pt-4 pb-6 px-6 border-t flex-shrink-0">
            <Button type="button" onClick={() => setShowPrivacyDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Signup;
