import { Link } from "react-router-dom";
import { MapPin, Users, Calendar, Award, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/quilt-match-home/avatar";
import type { Retreat } from "@/data/quiltMatchHomeRetreats";

export function CreatorModal({
  retreat,
  open,
  onOpenChange,
}: {
  retreat: Retreat;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const c = retreat.creator;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <Avatar initials={c.initials} tone="rust" size="lg" />
            <div>
              <DialogTitle className="font-display text-2xl">{c.name}</DialogTitle>
              <DialogDescription className="text-xs uppercase tracking-wider font-mono">
                Creator · {c.basedIn}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">{c.bio}</p>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Award className="h-3 w-3" />
              <span className="font-mono text-[10px] uppercase tracking-wider">Experience</span>
            </div>
            <p className="text-sm">{c.yearsTeaching} years teaching</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Sparkles className="h-3 w-3" />
              <span className="font-mono text-[10px] uppercase tracking-wider">Specialty</span>
            </div>
            <p className="text-sm">{c.specialty}</p>
          </div>
        </div>
        <div className="pt-3 border-t border-border">
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Upcoming retreat
          </h4>
          <p className="text-sm font-medium">{retreat.title}</p>
          <p className="text-xs text-muted-foreground">
            {retreat.dates} · {retreat.location}
          </p>
        </div>
        <Link
          to="/retreats"
          onClick={() => onOpenChange(false)}
          className="btn-primary px-4 py-3 text-xs font-medium text-center"
        >
          View {c.name.split(" ")[0]}'s retreat →
        </Link>
      </DialogContent>
    </Dialog>
  );
}

export function VenueModal({
  retreat,
  open,
  onOpenChange,
}: {
  retreat: Retreat;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const v = retreat.venueProfile;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <Avatar initials={v.initials} tone="match-indigo" size="lg" />
            <div>
              <DialogTitle className="font-display text-2xl">{v.name}</DialogTitle>
              <DialogDescription className="text-xs uppercase tracking-wider font-mono flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {v.location}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="aspect-video bg-muted overflow-hidden">
          <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
        <div className="flex items-center gap-2 text-sm pt-2">
          <Users className="h-4 w-4 text-match-indigo" />
          <span>Sleeps {v.capacity}</span>
          <span className="text-muted-foreground mx-1">·</span>
          <Calendar className="h-4 w-4 text-match-indigo" />
          <span className="text-muted-foreground">{retreat.dates}</span>
        </div>
        <div className="pt-3 border-t border-border">
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Amenities
          </h4>
          <ul className="grid grid-cols-2 gap-y-1 text-sm">
            {v.amenities.map((a) => (
              <li key={a} className="text-muted-foreground">· {a}</li>
            ))}
          </ul>
        </div>
        <Link
          to="/retreats"
          onClick={() => onOpenChange(false)}
          className="inline-flex items-center justify-center px-4 py-3 text-xs font-medium bg-match-indigo text-match-indigo-foreground hover:bg-match-indigo/90 transition-colors"
        >
          View retreats at {v.name} →
        </Link>
      </DialogContent>
    </Dialog>
  );
}

export function RetreatModal({
  retreat,
  open,
  onOpenChange,
}: {
  retreat: Retreat;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const r = retreat;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{r.title}</DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-wider font-mono">
            {r.dates} · {r.location} · {r.skill}
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video bg-muted overflow-hidden relative">
          <img src={r.image} alt={`${r.title} at ${r.venue}`} className="w-full h-full object-cover" />
          {r.spotsLeft <= 3 && (
            <span className="absolute top-3 left-3 bg-rust text-rust-foreground text-[10px] font-mono uppercase tracking-wider px-2 py-1">
              {r.spotsLeft} spots left
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Avatar initials={r.creator.initials} tone="rust" />
            <div className="text-[11px] leading-tight">
              <span className="block font-medium">{r.creator.name}</span>
              <span className="block text-muted-foreground">{r.creator.specialty}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar initials={r.venueProfile.initials} tone="match-indigo" />
            <div className="text-[11px] leading-tight">
              <span className="block font-medium">{r.venueProfile.name}</span>
              <span className="block text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {r.venueProfile.location}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border">
          {r.creator.bio}
        </p>

        <div className="pt-3 border-t border-border">
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            What's included
          </h4>
          <ul className="grid grid-cols-2 gap-y-1 text-sm">
            {r.venueProfile.amenities.map((a) => (
              <li key={a} className="text-muted-foreground">· {a}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-end justify-between gap-3 pt-3 border-t border-border">
          <div>
            <div className="font-display text-2xl text-rust leading-none">{r.price}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
              per quilter · all-inclusive
            </div>
          </div>
          <Link
            to="/signup"
            onClick={() => onOpenChange(false)}
            className="btn-primary px-4 py-2 text-xs font-medium whitespace-nowrap"
          >
            Register →
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
