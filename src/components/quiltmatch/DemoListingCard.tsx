import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Bell,
  CheckCircle2,
} from "lucide-react";
import type { MatchEvent } from "@/types/quiltmatch";

interface DemoListingCardProps {
  demo: MatchEvent;
}

export function DemoListingCard({ demo }: DemoListingCardProps) {
  return (
    <Card className="overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Decorative header */}
      <div className="relative h-40 bg-gradient-to-br from-primary/15 via-primary/10 to-accent/15 flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center mb-3 shadow-sm">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground leading-tight">
          Your Dream Retreat
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          We're making this happen for you
        </p>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Title */}
        <div>
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 border text-xs mb-2">
            Invite in Progress
          </Badge>
          <h4 className="text-base font-semibold text-foreground leading-tight">
            {demo.title}
          </h4>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>
              {demo.location.city}
              {demo.location.state ? `, ${demo.location.state}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{demo.duration_days} days</span>
          </div>
          {demo.dates.start && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>
                {new Date(demo.dates.start + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-foreground">
              ${demo.price_per_seat}
            </span>
            <span className="text-xs">/person est.</span>
          </div>
        </div>

        {/* Venue info */}
        {demo.venue.name && demo.venue.name !== "Venue TBD" && (
          <div className="bg-white/60 rounded-lg p-3 border border-border/40">
            <p className="text-sm font-medium text-foreground/80 mb-1">
              Potential Venue
            </p>
            <p className="text-sm text-muted-foreground">{demo.venue.name}</p>
            {demo.venue.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {demo.venue.amenities.slice(0, 4).map((a) => (
                  <Badge
                    key={a}
                    variant="outline"
                    className="text-xs text-muted-foreground"
                  >
                    {a.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Match reasons */}
        <div className="space-y-1.5">
          {demo.match_reasons.map((reason, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <span>{reason}</span>
            </div>
          ))}
        </div>

        {/* Notify me button */}
        <div className="pt-2 space-y-2">
          <Button className="w-full bg-accent hover:bg-accent/90 text-white">
            <Bell className="w-4 h-4 mr-2" />
            Notify Me When Available
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            <Heart className="w-3 h-3 inline mr-1" />
            We're reaching out to organizers who could make this real
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
