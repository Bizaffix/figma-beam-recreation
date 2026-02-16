import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  CheckCircle2,
  Scissors,
  MapPin,
  Calendar,
  DollarSign,
  BedDouble,
  ExternalLink,
  Globe,
  Shield,
  Sparkles,
  Users,
  ArrowRight,
} from "lucide-react";
import { getDraftByToken } from "@/services/discover";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { DraftListing } from "@/types/draft-listing";

export default function ClaimListing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get("token") || "";
  const [listing, setListing] = useState<DraftListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: preview, 2: claim form, 3: success

  // Claim form state
  const [claimerName, setClaimerName] = useState("");
  const [claimerEmail, setClaimerEmail] = useState("");
  const [claimerPhone, setClaimerPhone] = useState("");
  const [claimerRole, setClaimerRole] = useState("owner");
  const [aboutRetreat, setAboutRetreat] = useState("");
  const [eventsHosted, setEventsHosted] = useState("0");
  const [anythingElse, setAnythingElse] = useState("");
  const [agreeAuthorized, setAgreeAuthorized] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeFees, setAgreeFees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await getDraftByToken(token);
      setListing(data);
      setLoading(false);
    }
    load();
  }, [token]);

  const handleClaim = async () => {
    if (!listing) return;
    if (!claimerName.trim() || !claimerEmail.trim()) {
      toast({ title: "Please fill in your name and email", variant: "destructive" });
      return;
    }
    if (!agreeAuthorized || !agreeTerms || !agreeFees) {
      toast({ title: "Please agree to all checkboxes", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("draft_listings")
        .update({
          status: "pending_approval",
          organizer_name: claimerName,
          organizer_email: claimerEmail,
          organizer_phone: claimerPhone || null,
          claimed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("invite_token", token);

      if (error) throw error;

      setStep(3);
      toast({ title: "Listing claimed successfully!" });
    } catch (err) {
      console.error("Claim error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!token || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Scissors className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid or Expired Link</h2>
            <p className="text-muted-foreground mb-6">
              This claim link is no longer valid. If you believe this is an error,
              please contact us at RetreatVenue0@gmail.com.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (listing.status !== "draft" && listing.status !== "invited" && step !== 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Already Claimed</h2>
            <p className="text-muted-foreground mb-6">
              This listing has already been claimed. If you're the organizer,
              check your email for dashboard access.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary/5 border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scissors className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Book My Quilt Retreat</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {step === 3 ? "You're All Set!" : "Welcome — Here's Your Draft Listing"}
          </h1>
          {step !== 3 && (
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              We created this draft using publicly available info. You can claim it, 
              edit it, or ask us to remove it — at zero cost.
            </p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Success State */}
        {step === 3 && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Listing Submitted for Review</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                We're reviewing your listing — expect a response within 24 hours.
                You'll receive an email at <strong>{claimerEmail}</strong> once approved.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/signup")} className="bg-primary hover:bg-primary/90">
                  Create Your Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button onClick={() => navigate("/")} variant="outline">
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Draft Listing Preview */}
        {step <= 2 && (
          <Card className="overflow-hidden border-primary/20">
            <div className="bg-primary/5 px-5 py-3 flex items-center gap-2">
              <Badge className="bg-white text-primary border border-primary/20 text-xs">
                Draft Preview
              </Badge>
              <span className="text-sm text-muted-foreground">
                This is how students see your listing
              </span>
            </div>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-xl font-semibold">{listing.title}</h3>
              {listing.description && (
                <p className="text-muted-foreground">{listing.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {[listing.location_city, listing.location_region].filter(Boolean).join(", ") || "Location TBD"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  {listing.dates}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4 text-primary" />
                  {listing.pricing}
                </div>
                {listing.rooming && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BedDouble className="w-4 h-4 text-primary" />
                    {listing.rooming}
                  </div>
                )}
              </div>
              <a
                href={listing.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                View original source
              </a>
            </CardContent>
          </Card>
        )}

        {/* Student Interest Notification */}
        {step <= 2 && (
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-5 flex items-start gap-3">
              <Users className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Someone's waiting to hear from you
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  A quilter expressed interest in your retreat. Claim your listing to 
                  connect with them — it takes about 2 minutes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Preview → Claim CTA */}
        {step === 1 && (
          <div className="text-center">
            <Button
              onClick={() => setStep(2)}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-lg px-8"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Claim This Listing (Free)
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Not your listing?{" "}
              <a href="mailto:RetreatVenue0@gmail.com" className="text-primary hover:underline">
                Let us know
              </a>{" "}
              and we'll remove it.
            </p>
          </div>
        )}

        {/* Step 2: Claim Form */}
        {step === 2 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Verify & Claim</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm you're authorized to represent this retreat or venue.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Name <span className="text-red-400">*</span></Label>
                  <Input
                    value={claimerName}
                    onChange={(e) => setClaimerName(e.target.value)}
                    placeholder="Your name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Business Email <span className="text-red-400">*</span></Label>
                  <Input
                    value={claimerEmail}
                    onChange={(e) => setClaimerEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    type="email"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Phone (optional)</Label>
                  <Input
                    value={claimerPhone}
                    onChange={(e) => setClaimerPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Your Role</Label>
                  <Select value={claimerRole} onValueChange={setClaimerRole}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="organizer">Organizer</SelectItem>
                      <SelectItem value="venue_host">Venue Host</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-1">Tell Us About Your Retreat</h3>
                <p className="text-sm text-muted-foreground mb-4">Help us review your listing faster.</p>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Describe your retreat in one sentence</Label>
                    <Input
                      value={aboutRetreat}
                      onChange={(e) => setAboutRetreat(e.target.value)}
                      placeholder="A cozy mountain retreat for quilters of all levels..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">How many events have you hosted?</Label>
                    <Select value={eventsHosted} onValueChange={setEventsHosted}>
                      <SelectTrigger className="mt-1 w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">This will be my first</SelectItem>
                        <SelectItem value="1-3">1–3 events</SelectItem>
                        <SelectItem value="4-10">4–10 events</SelectItem>
                        <SelectItem value="10+">10+ events</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Anything else we should know? (optional)</Label>
                    <Textarea
                      value={anythingElse}
                      onChange={(e) => setAnythingElse(e.target.value)}
                      placeholder="Tell us what makes your retreat special..."
                      className="mt-1 resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Fee transparency */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border/40">
                <h4 className="text-sm font-semibold mb-3">Platform Fee Transparency</h4>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="bg-white rounded-lg p-3 border border-border/40">
                    <p className="text-lg font-bold text-primary">$0</p>
                    <p className="text-xs text-muted-foreground">First 3 events</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-border/40">
                    <p className="text-lg font-bold text-primary">6.8%</p>
                    <p className="text-xs text-muted-foreground">Events 4–7</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-border/40">
                    <p className="text-lg font-bold text-primary">5%</p>
                    <p className="text-xs text-muted-foreground">8+ events</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Fees only apply on confirmed bookings through our platform.
                </p>
              </div>

              {/* Agreements */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agree-authorized"
                    checked={agreeAuthorized}
                    onCheckedChange={(v) => setAgreeAuthorized(v === true)}
                  />
                  <Label htmlFor="agree-authorized" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    I confirm I'm authorized to represent this retreat/venue.
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agree-fees"
                    checked={agreeFees}
                    onCheckedChange={(v) => setAgreeFees(v === true)}
                  />
                  <Label htmlFor="agree-fees" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    I understand Book My Quilt Retreat will onboard students, collect payment, 
                    and pay me the remainder after transparent platform fees (see table above).
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agree-terms"
                    checked={agreeTerms}
                    onCheckedChange={(v) => setAgreeTerms(v === true)}
                  />
                  <Label htmlFor="agree-terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    I accept the Terms & Conditions, Privacy Policy, and Payout Terms.
                  </Label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  onClick={handleClaim}
                  disabled={submitting || !agreeAuthorized || !agreeTerms || !agreeFees}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Submit for Approval
                </Button>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
