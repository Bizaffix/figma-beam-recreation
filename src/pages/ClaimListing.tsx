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
  Globe,
  Shield,
  Sparkles,
  Users,
  ArrowRight,
  ArrowLeft,
  Upload,
  Trash2,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  Pencil,
} from "lucide-react";
import { getDraftByToken } from "@/services/discover";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { DraftListing } from "@/types/draft-listing";

const AMENITY_OPTIONS = [
  "Sewing tables",
  "Design wall",
  "Ironing/pressing stations",
  "Cutting stations",
  "Good lighting",
  "Meals included",
  "Snacks & beverages",
  "Wi-Fi",
  "Parking",
  "ADA accessible",
  "Laundry",
  "Pool/hot tub",
  "Outdoor space",
  "Close to shops",
];

const SKILL_LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced", "All levels"];

export default function ClaimListing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get("token") || "";
  const [listing, setListing] = useState<DraftListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [step, setStep] = useState(1);
  // Step 1: Preview + claim CTA
  // Step 2: Verify & contact info
  // Step 3: Edit listing details
  // Step 4: Application + agreements
  // Step 5: Success

  // Step 2: Verify & Claim
  const [claimerName, setClaimerName] = useState("");
  const [claimerEmail, setClaimerEmail] = useState("");
  const [claimerPhone, setClaimerPhone] = useState("");
  const [claimerRole, setClaimerRole] = useState("owner");

  // Step 3: Editable listing fields
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPricing, setEditPricing] = useState("");
  const [editDates, setEditDates] = useState("");
  const [editRooming, setEditRooming] = useState("");
  const [editLocationCity, setEditLocationCity] = useState("");
  const [editLocationRegion, setEditLocationRegion] = useState("");
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [editSkillLevels, setEditSkillLevels] = useState<string[]>([]);
  const [editMaxCapacity, setEditMaxCapacity] = useState("");
  const [editPolicies, setEditPolicies] = useState("");
  const [editCancellationPolicy, setEditCancellationPolicy] = useState("");
  const [editDepositInfo, setEditDepositInfo] = useState("");
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editFacebookUrl, setEditFacebookUrl] = useState("");
  const [editInstagramUrl, setEditInstagramUrl] = useState("");
  const [editMainImage, setEditMainImage] = useState("");
  const [editAdditionalImages, setEditAdditionalImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Step 4: Application
  const [aboutRetreat, setAboutRetreat] = useState("");
  const [eventsHosted, setEventsHosted] = useState("0");
  const [anythingElse, setAnythingElse] = useState("");
  const [agreeAuthorized, setAgreeAuthorized] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeFees, setAgreeFees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Interest count
  const [interestCount, setInterestCount] = useState(0);

  useEffect(() => {
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await getDraftByToken(token);
      if (data) {
        setListing(data);
        // Check token expiry
        if (data.invite_expires_at) {
          const expiresAt = new Date(data.invite_expires_at);
          if (expiresAt < new Date()) {
            setExpired(true);
          }
        } else if (data.created_at) {
          const created = new Date(data.created_at);
          const expiresAt = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (expiresAt < new Date()) {
            setExpired(true);
          }
        }
        // Populate editable fields
        setEditTitle(data.title || "");
        setEditDescription(data.description || "");
        setEditPricing(data.pricing || "");
        setEditDates(data.dates || "");
        setEditRooming(data.rooming || "");
        setEditLocationCity(data.location_city || "");
        setEditLocationRegion(data.location_region || "");
        setEditMainImage(data.main_image_url || "");
        setEditWebsiteUrl((data as any).website_url || data.organizer_website || "");
        setEditAmenities((data as any).amenities || []);
        setEditSkillLevels((data as any).skill_levels || []);
        setEditAdditionalImages((data as any).additional_images || []);
        // Pre-fill organizer info if available
        if (data.organizer_name) setClaimerName(data.organizer_name);
        if (data.organizer_email) setClaimerEmail(data.organizer_email);

        // Fetch interest count
        const { count } = await supabase
          .from("listing_interests")
          .select("*", { count: "exact", head: true })
          .eq("draft_listing_id", data.id);
        setInterestCount(count || 0);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `draft-listings/${listing?.id || "temp"}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("listing-images").upload(path, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      if (isMain) {
        setEditMainImage(publicUrl);
      } else {
        if (editAdditionalImages.length >= 12) {
          toast({ title: "Max 12 additional images", variant: "destructive" });
          return;
        }
        setEditAdditionalImages([...editAdditionalImages, publicUrl]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeAdditionalImage = (index: number) => {
    setEditAdditionalImages(editAdditionalImages.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    setEditAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleSkillLevel = (level: string) => {
    setEditSkillLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleSaveDraft = async () => {
    if (!listing) return;
    try {
      const { error } = await supabase
        .from("draft_listings")
        .update({
          title: editTitle,
          description: editDescription,
          pricing: editPricing,
          dates: editDates,
          rooming: editRooming,
          location_city: editLocationCity,
          location_region: editLocationRegion,
          main_image_url: editMainImage || null,
          additional_images: editAdditionalImages,
          amenities: editAmenities,
          skill_levels: editSkillLevels,
          max_capacity: editMaxCapacity ? parseInt(editMaxCapacity) : null,
          policies: editPolicies || null,
          cancellation_policy: editCancellationPolicy || null,
          deposit_info: editDepositInfo || null,
          website_url: editWebsiteUrl || null,
          facebook_url: editFacebookUrl || null,
          instagram_url: editInstagramUrl || null,
          organizer_name: claimerName,
          organizer_email: claimerEmail,
          organizer_phone: claimerPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("invite_token", token);

      if (error) throw error;
      toast({ title: "Draft saved! You can come back anytime." });
    } catch (err) {
      console.error("Save draft error:", err);
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

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
          // Contact info
          organizer_name: claimerName,
          organizer_email: claimerEmail,
          organizer_phone: claimerPhone || null,
          claimer_role: claimerRole,
          // Edited listing fields
          title: editTitle,
          description: editDescription,
          pricing: editPricing,
          dates: editDates,
          rooming: editRooming,
          location_city: editLocationCity,
          location_region: editLocationRegion,
          main_image_url: editMainImage || null,
          additional_images: editAdditionalImages,
          amenities: editAmenities,
          skill_levels: editSkillLevels,
          max_capacity: editMaxCapacity ? parseInt(editMaxCapacity) : null,
          policies: editPolicies || null,
          cancellation_policy: editCancellationPolicy || null,
          deposit_info: editDepositInfo || null,
          website_url: editWebsiteUrl || null,
          facebook_url: editFacebookUrl || null,
          instagram_url: editInstagramUrl || null,
          // Application answers
          application_about: aboutRetreat || null,
          application_events_hosted: eventsHosted,
          application_notes: anythingElse || null,
          // Timestamps
          claimed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("invite_token", token);

      if (error) throw error;

      setStep(5);
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

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full border-amber-200">
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link Expired</h2>
            <p className="text-muted-foreground mb-6">
              This claim link expired after 30 days. Don't worry — contact us and
              we'll send you a fresh link.
            </p>
            <div className="flex gap-3 justify-center">
              <a href="mailto:RetreatVenue0@gmail.com?subject=Expired claim link&body=My invite token: {token}">
                <Button className="bg-primary hover:bg-primary/90">
                  Email Us
                </Button>
              </a>
              <Button onClick={() => navigate("/")} variant="outline">
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (listing.status !== "draft" && listing.status !== "invited" && step !== 5) {
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

  const daysLeft = listing.invite_expires_at
    ? Math.max(0, Math.ceil((new Date(listing.invite_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : listing.created_at
      ? Math.max(0, 30 - Math.ceil((Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24)))
      : 30;

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
            {step === 5 ? "You're All Set!" : "Welcome — Here's Your Draft Listing"}
          </h1>
          {step !== 5 && (
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              We created this draft using publicly available info. You can claim it,
              edit it, or ask us to remove it — at zero cost.
            </p>
          )}
          {/* Progress indicator */}
          {step >= 1 && step <= 4 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    s <= step ? "bg-primary w-8" : "bg-muted w-4"
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2">Step {step} of 4</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Expiry warning */}
        {daysLeft <= 10 && step !== 5 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">
              This link expires in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>.
              Claim your listing before it expires.
            </p>
          </div>
        )}

        {/* ==================== Step 5: Success ==================== */}
        {step === 5 && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Listing Submitted for Review</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-2">
                We're reviewing your listing — expect a response within 24 hours.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You'll receive an email at <strong>{claimerEmail}</strong> once approved.
                {interestCount > 0 && ` You can then reply to ${interestCount} interested quilter${interestCount > 1 ? "s" : ""}.`}
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

        {/* ==================== Draft Listing Preview (visible in steps 1–4) ==================== */}
        {step <= 4 && (
          <Card className="overflow-hidden border-primary/20">
            <div className="bg-primary/5 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-white text-primary border border-primary/20 text-xs">
                  Draft Preview
                </Badge>
                <span className="text-sm text-muted-foreground">
                  This is how students see your listing
                </span>
              </div>
              {step >= 3 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  <Pencil className="w-3 h-3 mr-1" /> Editing
                </Badge>
              )}
            </div>
            <CardContent className="p-5 space-y-4">
              {/* Image */}
              {(editMainImage || listing.main_image_url) && (
                <img
                  src={editMainImage || listing.main_image_url || ""}
                  alt={editTitle || listing.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <h3 className="text-xl font-semibold">{editTitle || listing.title}</h3>
              {(editDescription || listing.description) && (
                <p className="text-muted-foreground">{editDescription || listing.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {[editLocationCity || listing.location_city, editLocationRegion || listing.location_region].filter(Boolean).join(", ") || "Location TBD"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  {editDates || listing.dates}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4 text-primary" />
                  {editPricing || listing.pricing}
                </div>
                {(editRooming || listing.rooming) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BedDouble className="w-4 h-4 text-primary" />
                    {editRooming || listing.rooming}
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
        {step <= 4 && interestCount > 0 && (
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-5 flex items-start gap-3">
              <Users className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {interestCount === 1
                    ? "Someone's waiting to hear from you"
                    : `${interestCount} quilters are waiting to hear from you`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {interestCount === 1
                    ? "A quilter expressed interest in your retreat."
                    : `${interestCount} quilters expressed interest in your retreat.`}
                  {" "}Claim your listing to connect with them — it takes about 5 minutes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================== Step 1: Preview → Start Claim ==================== */}
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

        {/* ==================== Step 2: Verify & Contact Info ==================== */}
        {step === 2 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Step 1: Verify & Claim</h3>
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

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (!claimerName.trim() || !claimerEmail.trim()) {
                      toast({ title: "Name and email are required", variant: "destructive" });
                      return;
                    }
                    setStep(3);
                  }}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Continue to Edit Listing
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================== Step 3: Edit Listing ==================== */}
        {step === 3 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Step 2: Review & Edit Your Listing</h3>
                <p className="text-sm text-muted-foreground">
                  Make it warm and vivid — this is what quilters will see. You can save and come back later.
                </p>
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Title <span className="text-red-400">*</span></Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Mountain View Quilt Retreat"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Description</Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    Make it warm and vivid — describe the atmosphere, what's included, and what makes it special.
                  </p>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Nestled in the Blue Ridge Mountains, our retreat offers..."
                    className="mt-1 resize-none"
                    rows={4}
                  />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Photos</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Main image */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Main photo (hero image)</p>
                    {editMainImage ? (
                      <div className="relative group">
                        <img
                          src={editMainImage}
                          alt="Main"
                          className="w-full h-40 object-cover rounded-lg border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setEditMainImage("")}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, true)}
                          disabled={uploadingImage}
                        />
                        {uploadingImage ? (
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Upload hero image</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>

                  {/* Additional images */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Additional photos ({editAdditionalImages.length}/12)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {editAdditionalImages.map((img, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={img}
                            alt={`Photo ${i + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeAdditionalImage(i)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      {editAdditionalImages.length < 12 && (
                        <label className="flex items-center justify-center h-20 border-2 border-dashed rounded cursor-pointer hover:border-primary/50 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, false)}
                            disabled={uploadingImage}
                          />
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Pricing</Label>
                  <Input
                    value={editPricing}
                    onChange={(e) => setEditPricing(e.target.value)}
                    placeholder="$450/person or Contact me"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Dates</Label>
                  <Input
                    value={editDates}
                    onChange={(e) => setEditDates(e.target.value)}
                    placeholder="March 15–18, 2026 or Year-round"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">City</Label>
                  <Input
                    value={editLocationCity}
                    onChange={(e) => setEditLocationCity(e.target.value)}
                    placeholder="Asheville"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">State / Region</Label>
                  <Input
                    value={editLocationRegion}
                    onChange={(e) => setEditLocationRegion(e.target.value)}
                    placeholder="North Carolina"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Rooming Options</Label>
                  <Input
                    value={editRooming}
                    onChange={(e) => setEditRooming(e.target.value)}
                    placeholder="Private rooms, shared, max 20 guests"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Max Capacity</Label>
                  <Input
                    value={editMaxCapacity}
                    onChange={(e) => setEditMaxCapacity(e.target.value)}
                    placeholder="20"
                    type="number"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Skill Levels */}
              <div>
                <Label className="text-sm mb-2 block">Skill Levels Welcome</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_LEVEL_OPTIONS.map((level) => (
                    <button
                      key={level}
                      onClick={() => toggleSkillLevel(level)}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                        editSkillLevels.includes(level)
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <Label className="text-sm mb-2 block">Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2">
                      <Checkbox
                        id={`amenity-${amenity}`}
                        checked={editAmenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <Label
                        htmlFor={`amenity-${amenity}`}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        {amenity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">House Rules / Policies (optional)</Label>
                  <Textarea
                    value={editPolicies}
                    onChange={(e) => setEditPolicies(e.target.value)}
                    placeholder="No smoking, quiet hours after 10 PM..."
                    className="mt-1 resize-none"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Cancellation Policy (optional)</Label>
                    <Input
                      value={editCancellationPolicy}
                      onChange={(e) => setEditCancellationPolicy(e.target.value)}
                      placeholder="Full refund 30 days before"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Deposit Required (optional)</Label>
                    <Input
                      value={editDepositInfo}
                      onChange={(e) => setEditDepositInfo(e.target.value)}
                      placeholder="$100 to reserve"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Website URL</Label>
                  <Input
                    value={editWebsiteUrl}
                    onChange={(e) => setEditWebsiteUrl(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Facebook</Label>
                  <Input
                    value={editFacebookUrl}
                    onChange={(e) => setEditFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Instagram</Label>
                  <Input
                    value={editInstagramUrl}
                    onChange={(e) => setEditInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Continue to Submit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================== Step 4: Application + Agreements ==================== */}
        {step === 4 && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Step 3: Submit for Approval</h3>
                <p className="text-sm text-muted-foreground">
                  Almost done! A few quick questions and you're on your way.
                </p>
              </div>

              {/* Why approval */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border/40">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Why do we review listings?
                </h4>
                <p className="text-xs text-muted-foreground">
                  We review every listing to keep the directory trustworthy and safe for students.
                  We check that contact info is real, images are appropriate, and details are clear.
                  Most listings are approved within 24 hours.
                </p>
              </div>

              {/* Application questions */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Tell us about your retreat in one sentence</Label>
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
                      <SelectItem value="1-3">1-3 events</SelectItem>
                      <SelectItem value="4-10">4-10 events</SelectItem>
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
                    <p className="text-xs text-muted-foreground">Events 4-7</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-border/40">
                    <p className="text-lg font-bold text-primary">5%</p>
                    <p className="text-xs text-muted-foreground">8+ events</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Fees only apply on confirmed bookings through our platform.
                  Example: On a $500 retreat (event #5), fee = $34, you receive $466.
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
                <Button variant="ghost" onClick={() => setStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-1" />
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
