import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, ArrowRight, ChevronRight, Users, Building2 } from "lucide-react";
import { QM_TEAL, QM_RUST } from "@/lib/quilt-match-home-brand";
import { fetchHomepageVenues, type MarketingVenue } from "@/lib/marketing-venues";
import retreat1 from "@/assets/quilt-match-home/retreat-1.jpg";
import retreat2 from "@/assets/quilt-match-home/retreat-2.jpg";
import retreat3 from "@/assets/quilt-match-home/retreat-3.jpg";
import retreat4 from "@/assets/quilt-match-home/retreat-4.jpg";
import heroVenue from "@/assets/quilt-match-home/hero-venue.jpg";
import heroQuilter from "@/assets/quilt-match-home/hero-quilter.jpg";

const FALLBACK_VENUES: MarketingVenue[] = [
  { id: "fallback-1", name: "The Riverbend Studio", location: "Maine", availableLabel: "Available Sept 22", image: retreat1, sleeps: 12 },
  { id: "fallback-2", name: "Wildflower Plains Inn", location: "Montana", availableLabel: "Available Oct 1", image: retreat2, sleeps: 16 },
  { id: "fallback-3", name: "Spruce Hollow Lodge", location: "Vermont", availableLabel: "Available Oct 12", image: retreat3, sleeps: 14 },
  { id: "fallback-4", name: "The Loomery", location: "Oregon", availableLabel: "Available Nov 4", image: retreat4, sleeps: 10 },
  { id: "fallback-5", name: "Cedar Creek Hall", location: "N Carolina", availableLabel: "Available Jan 15", image: heroVenue, sleeps: 22 },
  { id: "fallback-6", name: "The Grange Attic", location: "Texas", availableLabel: "Available Feb 10", image: heroQuilter, sleeps: 8 },
];

function VenueCard({ venue }: { venue: MarketingVenue }) {
  const inquireTo = venue.id.startsWith("fallback-")
    ? "/signup"
    : `/signup?property=${encodeURIComponent(venue.id)}`;

  return (
    <Link
      to={inquireTo}
      className="group border border-border bg-card hover:shadow-lg hover:border-[#3A6B6E]/40 transition-all rounded-[8px] overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
        {venue.image ? (
          <img
            src={venue.image}
            alt={venue.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Building2 className="w-10 h-10 text-muted-foreground/40" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-md"
          style={{ background: QM_TEAL }}
        >
          OPEN
        </div>

        {venue.sleeps && venue.sleeps > 0 ? (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-black/50 backdrop-blur-sm">
            <Users className="h-3 w-3" aria-hidden /> {venue.sleeps} sleeps
          </div>
        ) : null}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-foreground group-hover:text-[#3A6B6E] transition-colors text-lg mb-3 leading-tight">
          {venue.name}
        </h3>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {venue.location}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden /> {venue.availableLabel}
          </span>
        </div>

        <div className="pt-3 border-t border-border mt-auto">
          <span
            className="text-sm font-semibold flex items-center gap-1.5 group-hover:gap-2.5 transition-all"
            style={{ color: QM_RUST }}
          >
            Inquire about availability <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
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
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
              style={{ background: QM_TEAL }}
            />
            <h2
              id="open-venues-heading"
              className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight"
            >
              Available Venues
            </h2>
          </div>
          <Link
            to="/venues"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            View all <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="rounded-[8px] border border-border bg-muted/40 animate-pulse overflow-hidden"
                aria-hidden
              >
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-2/3 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                  <div className="h-4 w-1/3 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
