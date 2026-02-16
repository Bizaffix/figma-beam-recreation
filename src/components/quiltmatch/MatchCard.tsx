import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import type { MatchEvent } from "@/types/quiltmatch";
import { useNavigate } from "react-router-dom";

interface MatchCardProps {
  match: MatchEvent;
}

const confidenceColors: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-red-100 text-red-700 border-red-200",
  hypothetical_high_demand: "bg-purple-100 text-purple-800 border-purple-200",
};

const confidenceLabels: Record<string, string> = {
  high: "Strong Match",
  medium: "Good Match",
  low: "Partial Match",
  hypothetical_high_demand: "Dream Retreat",
};

const skillColors: Record<string, string> = {
  beginner: "bg-teal-100 text-teal-800",
  intermediate: "bg-blue-100 text-blue-800",
  advanced: "bg-purple-100 text-purple-800",
};

export function MatchCard({ match }: MatchCardProps) {
  const navigate = useNavigate();
  const isReal = match.type === "real";
  const image = (match as Record<string, unknown>).image as string | undefined;

  const handleBookNow = () => {
    if (isReal && match.id) {
      navigate(`/retreat/${match.id}`);
    }
  };

  return (
    <Card className="overflow-hidden transition-craft hover:shadow-craft-hover border border-border/60 group">
      {/* Image or gradient header */}
      <div className="relative h-48 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={match.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-primary/40" />
          </div>
        )}

        {/* Confidence badge */}
        <div className="absolute top-3 left-3">
          <Badge
            className={`${
              confidenceColors[match.match_confidence] || confidenceColors.medium
            } border text-xs font-medium`}
          >
            {confidenceLabels[match.match_confidence] || "Match"}
          </Badge>
        </div>

        {/* Type badge */}
        {!isReal && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-accent/90 text-white border-0 text-xs">
              Coming Soon
            </Badge>
          </div>
        )}

        {/* Price overlay */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
          <span className="text-lg font-bold text-foreground">
            ${match.price_per_seat}
          </span>
          <span className="text-xs text-muted-foreground">/person</span>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Title & skill level */}
        <div>
          <div className="flex items-start gap-2 mb-2">
            <Badge
              className={`${
                skillColors[match.skill_level] || skillColors.beginner
              } text-xs shrink-0`}
            >
              {match.skill_level.charAt(0).toUpperCase() +
                match.skill_level.slice(1)}
            </Badge>
            {match.theme.slice(0, 2).map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                {t.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
          <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-2">
            {match.title}
          </h3>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">
              {match.location.city}
              {match.location.state ? `, ${match.location.state}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{match.duration_days} days</span>
          </div>
          {match.dates.start && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="truncate">
                {typeof match.dates.start === "string" && match.dates.start.includes("-")
                  ? new Date(match.dates.start + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : match.dates.start}
              </span>
            </div>
          )}
          {match.ratings_avg > 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{match.ratings_avg.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Venue & Organizer */}
        {(match.venue.name || match.organizer.name) && (
          <div className="text-sm space-y-1">
            {match.venue.name && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground/80">Venue:</span>{" "}
                {match.venue.name}
              </p>
            )}
            {match.organizer.name && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground/80">By:</span>{" "}
                {match.organizer.name}
              </p>
            )}
          </div>
        )}

        {/* Match reasons */}
        <div className="space-y-1.5">
          {match.match_reasons.slice(0, 3).map((reason, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <span>{reason}</span>
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="pt-2">
          {isReal ? (
            <Button
              onClick={handleBookNow}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              View Retreat
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/5"
              disabled
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Inviting Organizers...
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
