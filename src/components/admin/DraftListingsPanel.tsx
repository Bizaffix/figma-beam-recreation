import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  BedDouble,
  Globe,
  Users,
  Eye,
  MessageSquare,
  ExternalLink,
  FileEdit,
  Search,
  Shield,
  Mail,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { DraftListing } from "@/types/draft-listing";

interface ListingInterest {
  id: string;
  student_name: string | null;
  student_email: string | null;
  student_message: string | null;
  contact_preference: string;
  created_at: string;
}

interface DraftListingWithInterests extends DraftListing {
  interest_count?: number;
  interests?: ListingInterest[];
  // V2 fields
  claimer_role?: string;
  application_about?: string;
  application_events_hosted?: string;
  application_notes?: string;
  additional_images?: string[];
  amenities?: string[];
  skill_levels?: string[];
  max_capacity?: number;
  website_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  policies?: string;
  cancellation_policy?: string;
  review_flags?: string[];
  admin_notes?: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  invited: "bg-blue-50 text-blue-700 border-blue-200",
  claimed: "bg-purple-50 text-purple-700 border-purple-200",
  pending_approval: "bg-amber-50 text-amber-700 border-amber-200",
  live: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  removed: "bg-gray-50 text-gray-500 border-gray-200",
};

export function DraftListingsPanel() {
  const { toast } = useToast();
  const [listings, setListings] = useState<DraftListingWithInterests[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending_approval");
  const [selectedListing, setSelectedListing] = useState<DraftListingWithInterests | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("draft_listings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch interest counts for each listing
      const listingsWithCounts: DraftListingWithInterests[] = [];
      for (const listing of (data || [])) {
        const { count } = await supabase
          .from("listing_interests")
          .select("*", { count: "exact", head: true })
          .eq("draft_listing_id", listing.id);
        listingsWithCounts.push({ ...listing, interest_count: count || 0 });
      }

      setListings(listingsWithCounts);
    } catch (err) {
      console.error("Error fetching draft listings:", err);
      toast({ title: "Failed to load draft listings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const openDetail = async (listing: DraftListingWithInterests) => {
    setSelectedListing(listing);
    setDetailOpen(true);
    setAdminMessage("");
    setLoadingDetail(true);

    // Fetch interests for this listing
    const { data: interests } = await supabase
      .from("listing_interests")
      .select("*")
      .eq("draft_listing_id", listing.id)
      .order("created_at", { ascending: false });

    setSelectedListing({ ...listing, interests: interests || [] });
    setLoadingDetail(false);
  };

  const handleAction = async (action: "approve" | "request_edits" | "reject" | "flag") => {
    if (!selectedListing) return;

    if ((action === "request_edits" || action === "reject") && !adminMessage.trim()) {
      toast({ title: "Please add a message explaining the reason", variant: "destructive" });
      return;
    }

    setActionLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const headers: Record<string, string> = {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      };

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/quiltmatch-admin`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          listing_id: selectedListing.id,
          action,
          message_to_organizer: adminMessage || undefined,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `Action failed (${res.status})`);
      }

      const result = await res.json();

      toast({
        title: action === "approve" ? "Listing approved!" : 
               action === "reject" ? "Listing rejected" :
               action === "request_edits" ? "Edit request sent" : "Listing flagged",
        description: result.message || `Action "${action}" completed.`,
      });

      setDetailOpen(false);
      fetchListings();
    } catch (err) {
      console.error("Admin action error:", err);
      toast({
        title: "Action failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const counts = {
    pending: listings.filter((l) => l.status === "pending_approval").length,
    total: listings.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Web-Discovered Listings
          </h2>
          <p className="text-sm text-muted-foreground">
            Review listings discovered from web search and claimed by organizers
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchListings} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "pending_approval", label: "Pending Review", icon: Clock },
          { value: "draft", label: "Draft" },
          { value: "invited", label: "Invited" },
          { value: "live", label: "Live", icon: CheckCircle2 },
          { value: "rejected", label: "Rejected", icon: XCircle },
          { value: "all", label: "All" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              filter === tab.value
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {tab.label}
            {tab.value === "pending_approval" && filter !== "pending_approval" && counts.pending > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Listing cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileEdit className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No listings with status "{filter}"</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <Card
              key={listing.id}
              className="cursor-pointer hover:shadow-md transition-shadow border"
              onClick={() => openDetail(listing)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Status + Interest count */}
                <div className="flex items-center justify-between">
                  <Badge className={`text-xs ${statusColors[listing.status] || ""}`}>
                    {listing.status.replace("_", " ")}
                  </Badge>
                  {(listing.interest_count || 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs text-accent">
                      <Users className="w-3 h-3" />
                      {listing.interest_count} interested
                    </span>
                  )}
                </div>

                {/* Image */}
                {listing.main_image_url && (
                  <img
                    src={listing.main_image_url}
                    alt={listing.title}
                    className="w-full h-28 object-cover rounded"
                  />
                )}

                {/* Title & location */}
                <h4 className="font-medium text-sm line-clamp-2">{listing.title}</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {[listing.location_city, listing.location_region].filter(Boolean).join(", ") || "Unknown"}
                </div>

                {/* Organizer */}
                {listing.organizer_name && (
                  <div className="text-xs text-muted-foreground">
                    Organizer: <span className="font-medium">{listing.organizer_name}</span>
                    {listing.organizer_email && (
                      <span className="text-primary ml-1">({listing.organizer_email})</span>
                    )}
                  </div>
                )}

                {/* Extraction confidence */}
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded ${
                    listing.extraction_confidence === "high" ? "bg-emerald-50 text-emerald-600" :
                    listing.extraction_confidence === "medium" ? "bg-amber-50 text-amber-600" :
                    "bg-red-50 text-red-600"
                  }`}>
                    {listing.extraction_confidence} confidence
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail / Review Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Review Listing
            </DialogTitle>
            <DialogDescription>
              Review details, view student interests, and take action.
            </DialogDescription>
          </DialogHeader>

          {selectedListing && (
            <div className="space-y-6">
              {/* Status bar */}
              <div className="flex items-center justify-between">
                <Badge className={`${statusColors[selectedListing.status] || ""}`}>
                  {selectedListing.status.replace("_", " ")}
                </Badge>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Created: {new Date(selectedListing.created_at).toLocaleDateString()}</span>
                  {selectedListing.claimed_at && (
                    <span>Claimed: {new Date(selectedListing.claimed_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Listing preview */}
              <Card className="border-primary/20">
                <CardContent className="p-5 space-y-4">
                  {selectedListing.main_image_url && (
                    <img
                      src={selectedListing.main_image_url}
                      alt={selectedListing.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <h3 className="text-lg font-semibold">{selectedListing.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedListing.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      {[selectedListing.location_city, selectedListing.location_region].filter(Boolean).join(", ")}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      {selectedListing.dates}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4 text-primary" />
                      {selectedListing.pricing}
                    </div>
                    {selectedListing.rooming && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BedDouble className="w-4 h-4 text-primary" />
                        {selectedListing.rooming}
                      </div>
                    )}
                  </div>
                  {selectedListing.amenities && selectedListing.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedListing.amenities.map((a) => (
                        <span key={a} className="text-xs bg-primary/5 text-primary px-2 py-0.5 rounded-full">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  <a
                    href={selectedListing.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Original source
                  </a>
                </CardContent>
              </Card>

              {/* Organizer info */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Organizer / Claimer Info
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      <span className="font-medium">{selectedListing.organizer_name || "Not claimed"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="font-medium">{selectedListing.organizer_email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      {selectedListing.organizer_phone || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Role:</span>{" "}
                      {selectedListing.claimer_role || "N/A"}
                    </div>
                    {selectedListing.website_url && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Website:</span>{" "}
                        <a href={selectedListing.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {selectedListing.website_url}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Application answers */}
              {(selectedListing.application_about || selectedListing.application_events_hosted) && (
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Application Answers
                    </h4>
                    {selectedListing.application_about && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">About:</span>{" "}
                        {selectedListing.application_about}
                      </div>
                    )}
                    {selectedListing.application_events_hosted && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Events hosted:</span>{" "}
                        {selectedListing.application_events_hosted}
                      </div>
                    )}
                    {selectedListing.application_notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Notes:</span>{" "}
                        {selectedListing.application_notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Student interests */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    Student Interests ({selectedListing.interests?.length || 0})
                  </h4>
                  {loadingDetail ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : selectedListing.interests && selectedListing.interests.length > 0 ? (
                    <div className="space-y-2">
                      {selectedListing.interests.map((interest) => (
                        <div
                          key={interest.id}
                          className="bg-muted/30 rounded-lg p-3 text-sm space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {interest.student_name || "Anonymous"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(interest.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {interest.student_email && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {interest.student_email}
                            </div>
                          )}
                          {interest.student_message && (
                            <p className="text-muted-foreground italic">
                              "{interest.student_message}"
                            </p>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Contact pref: {interest.contact_preference}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No student interests yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Review flags (auto-detected) */}
              {selectedListing.status === "pending_approval" && (
                <Card className="border-amber-200">
                  <CardContent className="p-5 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Review Flags
                    </h4>
                    <div className="space-y-1 text-sm">
                      {!selectedListing.main_image_url && (
                        <p className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> No main image uploaded
                        </p>
                      )}
                      {!selectedListing.organizer_email && (
                        <p className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> No organizer email
                        </p>
                      )}
                      {(!selectedListing.website_url && !selectedListing.facebook_url && !selectedListing.instagram_url) && (
                        <p className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> No website or social presence
                        </p>
                      )}
                      {selectedListing.extraction_confidence === "low" && (
                        <p className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Low extraction confidence
                        </p>
                      )}
                      {selectedListing.pricing === "Contact organizer" && (
                        <p className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> No pricing listed
                        </p>
                      )}
                      {selectedListing.main_image_url && selectedListing.organizer_email && selectedListing.extraction_confidence !== "low" && (
                        <p className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> No issues detected
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin action area */}
              {(selectedListing.status === "pending_approval" || selectedListing.status === "draft" || selectedListing.status === "invited") && (
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <h4 className="font-medium">Admin Actions</h4>
                    <div>
                      <Label className="text-sm">Message to organizer (required for reject/request edits)</Label>
                      <Textarea
                        value={adminMessage}
                        onChange={(e) => setAdminMessage(e.target.value)}
                        placeholder="Please upload a higher-resolution main image and clarify rooming options..."
                        className="mt-1 resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleAction("approve")}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleAction("request_edits")}
                        disabled={actionLoading}
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Request Edits
                      </Button>
                      <Button
                        onClick={() => handleAction("reject")}
                        disabled={actionLoading}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleAction("flag")}
                        disabled={actionLoading}
                        variant="outline"
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Flag for Follow-up
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
