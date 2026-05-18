import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, ArrowRight, ChevronRight } from "lucide-react";
import { QM_TEAL, QM_RUST, QM_TEAL_LIGHT } from "@/lib/quilt-match-home-brand";
import { fetchHomepageVenues, type MarketingVenue } from "@/lib/marketing-venues";

const FALLBACK_VENUES: MarketingVenue[] = [
  { id: "fallback-1", name: "The Riverbend Studio", location: "Maine", availableLabel: "Available Sept 22" },
  { id: "fallback-2", name: "Wildflower Plains Inn", location: "Montana", availableLabel: "Available Oct 1" },
  { id: "fallback-3", name: "Spruce Hollow Lodge", location: "Vermont", availableLabel: "Available Oct 12" },
  { id: "fallback-4", name: "The Loomery", location: "Oregon", availableLabel: "Available Nov 4" },
  { id: "fallback-5", name: "Cedar Creek Hall", location: "N Carolina", availableLabel: "Available Jan 15" },
  { id: "fallback-6", name: "The Grange Attic", location: "Texas", availableLabel: "Available Feb 10" },
];

function VenueCard({ venue }: { venue: MarketingVenue }) {
  const inquireTo = venue.id.startsWith("fallback-")
    ? "/signup"
    : `/signup?property=${encodeURIComponent(venue.id)}`;

  return (
    <Link
      to={inquireTo}
      className="flex flex-col gap-3 border-2 border-border bg-background rounded-[8px] p-5 hover:border-[#3A6B6E]/60 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-bold text-foreground group-hover:text-[#3A6B6E] transition-colors text-base leading-snug">
          {venue.name}
        </h3>
        <span
          className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full"
          style={{ background: QM_TEAL_LIGHT, color: QM_TEAL }}
        >
          OPEN
        </span>
      </div>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {venue.location}
        </span>
        <span className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden /> {venue.availableLabel}
        </span>
      </div>
      <div className="pt-3 border-t border-border">
        <span
          className="text-sm font-semibold flex items-center gap-1.5 group-hover:gap-2.5 transition-all"
          style={{ color: QM_RUST }}
        >
          Inquire about availability <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function OpenVenuesSection() {
  const [venues, setVenues] = useState<MarketingVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const rows = await fetchHomepageVenues();
      if (cancelled) return;
      setVenues(rows.length > 0 ? rows : FALLBACK_VENUES);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-16 px-5 bg-card border-y border-border" aria-labelledby="open-venues-heading">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ background: QM_TEAL }} />
            <h2
              id="open-venues-heading"
              className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight"
            >
              Available Venues
            </h2>
          </div>
          <Link
            to="/venues"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap sm:justify-end"
          >
            View all <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="h-[168px] rounded-[8px] border-2 border-border bg-muted/40 animate-pulse"
                aria-hidden
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
