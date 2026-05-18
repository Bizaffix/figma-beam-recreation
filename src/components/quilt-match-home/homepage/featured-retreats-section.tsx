import { Link } from "react-router-dom";
import { MapPin, Calendar, Home, ChevronRight } from "lucide-react";
import type { Retreat } from "@/data/quiltMatchHomeRetreats";
import { LEVEL_BADGE, QM_RUST, QM_TEAL, QM_TEAL_LIGHT, skillLevelLabel } from "@/lib/quilt-match-home-brand";

type Props = { retreats: Retreat[] };

export function FeaturedRetreatsSection({ retreats }: Props) {
  return (
    <section className="py-20 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: QM_TEAL }}>
              Upcoming Retreats
            </p>
            <h2 className="font-display text-4xl md:text-[2.6rem] font-bold text-foreground mb-2">
              Retreats Worth Getting Excited About
            </h2>
            <p className="text-muted-foreground text-base">
              Hand-picked experiences across the country — from mountain lodges to coastal studios.
            </p>
          </div>
          <Link
            to="/retreats"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-6"
          >
            Browse all retreats <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {retreats.map((r) => {
            const level = skillLevelLabel(r.skill);
            const badge = LEVEL_BADGE[level] ?? { bg: QM_TEAL_LIGHT, text: QM_TEAL };
            const showSpots = r.spotsLeft > 0 && r.spotsLeft <= 5;

            return (
              <article
                key={r.id}
                className="group border border-border bg-card hover:shadow-lg hover:border-[#3A6B6E]/40 transition-all rounded-[8px] overflow-hidden flex flex-col"
              >
                <Link to={`/retreat/${r.id}`} className="relative aspect-[4/3] bg-secondary overflow-hidden block">
                  <img
                    src={r.image}
                    alt={r.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-md"
                    style={{ background: badge.bg, color: badge.text }}
                  >
                    {level}
                  </div>
                  {showSpots && (
                    <div
                      className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-md"
                      style={{ background: QM_RUST }}
                    >
                      {r.spotsLeft} spots left
                    </div>
                  )}
                </Link>

                <div className="p-5 flex flex-col flex-1">
                  <Link to={`/retreat/${r.id}`}>
                    <h3 className="font-display text-lg font-bold leading-tight group-hover:text-[#3A6B6E] transition-colors mb-2">
                      {r.title}
                    </h3>
                  </Link>

                  <p className="text-sm font-medium mb-1" style={{ color: QM_TEAL }}>
                    {r.creator.name}
                  </p>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Home className="h-2.5 w-2.5 shrink-0" aria-hidden /> {r.venue}
                  </p>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden /> {r.location}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 flex-1">
                    <Calendar className="h-2.5 w-2.5 shrink-0" aria-hidden /> {r.dates}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-lg font-bold font-display" style={{ color: QM_TEAL }}>
                      ${r.priceNumber.toLocaleString()}
                    </span>
                    <Link
                      to={`/retreat/${r.id}`}
                      className="text-sm font-semibold text-white px-4 py-2 rounded-[4px] transition-colors shadow-sm hover:opacity-90"
                      style={{ background: QM_RUST }}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
