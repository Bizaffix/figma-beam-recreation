import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileEdit,
  MapPin,
  Calendar,
  DollarSign,
  BedDouble,
  ExternalLink,
  Heart,
  Bookmark,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Sparkles,
} from "lucide-react";
import type { DraftListing } from "@/types/draft-listing";
import { InterestModal } from "./InterestModal";

interface DraftListingCardProps {
  listing: DraftListing;
  onInterestSent?: () => void;
  onDismiss?: (listingId: string) => void;
}

const confidenceConfig = {
  high: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "" },
  medium: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Some details may be missing" },
  low: { color: "bg-red-50 text-red-700 border-red-200", label: "Limited info — we'll ask the organizer" },
};

const SAVED_KEY = "quiltmatch_saved_listings";
const DISMISSED_KEY = "quiltmatch_dismissed_listings";

function getSavedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
  } catch {
    return [];
  }
}

function setSavedIds(ids: string[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
}

export function getDismissedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
}

function setDismissedIds(ids: string[]) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

export function DraftListingCard({ listing, onInterestSent, onDismiss }: DraftListingCardProps) {
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setSaved(getSavedIds().includes(listing.id));
  }, [listing.id]);

  const conf = confidenceConfig[listing.extraction_confidence] || confidenceConfig.medium;
  const locationParts = [listing.location_city, listing.location_region].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(", ") : "Location TBD";

  const handleSave = () => {
    const ids = getSavedIds();
    if (ids.includes(listing.id)) {
      setSavedIds(ids.filter((id) => id !== listing.id));
      setSaved(false);
    } else {
      setSavedIds([...ids, listing.id]);
      setSaved(true);
    }
  };

  const handleDismiss = () => {
    const ids = getDismissedIds();
    if (!ids.includes(listing.id)) {
      setDismissedIds([...ids, listing.id]);
    }
    setDismissed(true);
    onDismiss?.(listing.id);
  };

  if (dismissed) return null;

  return (
    <>
      <Card className="overflow-hidden transition-craft hover:shadow-craft-hover border border-border/60 group relative">
        {/* Draft badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-white/95 text-primary border border-primary/20 text-xs font-medium shadow-sm">
            <FileEdit className="w-3 h-3 mr-1" />
            Draft Listing
          </Badge>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 border border-border/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200"
          title="Not a fit — hide this"
        >
          <XCircle className="w-4 h-4 text-muted-foreground hover:text-red-500" />
        </button>

        {/* Image or gradient */}
        <div className="relative h-44 overflow-hidden">
          {listing.main_image_url ? (
            <img
              src={listing.main_image_url}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary/30" />
            </div>
          )}

          {/* Source attribution */}
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-black/80 transition-colors"
          >
            <Globe className="w-3 h-3" />
            Source
          </a>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="text-base font-semibold text-foreground leading-tight line-clamp-2">
            {listing.title}
          </h3>

          {/* Vibe line */}
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {listing.description}
            </p>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{locationStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{listing.dates}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{listing.pricing}</span>
            </div>
            {listing.rooming && (
              <div className="flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{listing.rooming}</span>
              </div>
            )}
          </div>

          {/* Confidence warning */}
          {listing.extraction_confidence !== "high" && conf.label && (
            <div className={`flex items-start gap-2 text-xs px-2.5 py-1.5 rounded-md border ${conf.color}`}>
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{conf.label}</span>
            </div>
          )}

          {/* Organizer info */}
          {listing.organizer_name && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span>By {listing.organizer_name}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => setShowInterestModal(true)}
              className="flex-1 bg-primary hover:bg-primary/90 text-white text-sm h-9"
            >
              <Heart className="w-3.5 h-3.5 mr-1.5" />
              I'm Interested
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 shrink-0 ${saved ? "text-accent border-accent/30 bg-accent/5" : ""}`}
              onClick={handleSave}
              title={saved ? "Remove from saved" : "Save for later"}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-accent" : ""}`} />
            </Button>
          </div>

          {/* Saved indicator */}
          {saved && (
            <p className="text-xs text-accent flex items-center gap-1">
              <Bookmark className="w-3 h-3 fill-accent" />
              Saved for later
            </p>
          )}

          {/* Source link */}
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View original listing
          </a>
        </CardContent>
      </Card>

      {/* Interest Modal */}
      <InterestModal
        open={showInterestModal}
        onOpenChange={setShowInterestModal}
        listing={listing}
        onSuccess={() => {
          setShowInterestModal(false);
          onInterestSent?.();
        }}
      />
    </>
  );
}
