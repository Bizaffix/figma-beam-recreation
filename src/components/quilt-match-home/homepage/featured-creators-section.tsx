import { Link } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import type { Retreat } from "@/data/quiltMatchHomeRetreats";
import { QM_RUST, QM_TEAL, QM_AMBER } from "@/lib/quilt-match-home-brand";

const CREATOR_COLORS = [QM_RUST, QM_TEAL, QM_AMBER, "#6B6760"];

type Props = { creators: Retreat[] };

export function FeaturedCreatorsSection({ creators }: Props) {
  return (
    <section className="py-20 px-5 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: QM_RUST }}>
              Featured Instructors
            </p>
            <h2 className="font-display text-4xl md:text-[2.6rem] font-bold text-foreground">Meet Your Teachers</h2>
          </div>
          <Link
            to="/creators"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-4"
          >
            View all instructors <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <p className="text-muted-foreground text-base mb-12">
          Expert quilters, pattern designers, and teachers hosting retreats across the country.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {creators.map((r, i) => {
            const color = CREATOR_COLORS[i % CREATOR_COLORS.length];
            const c = r.creator;
            return (
              <article
                key={c.name}
                className="group border border-border bg-background hover:shadow-md transition-all rounded-[8px] p-6 flex flex-col"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mb-5 shrink-0 font-display"
                  style={{ backgroundColor: color }}
                >
                  {c.initials}
                </div>
                <h3 className="font-display text-lg font-bold mb-1 group-hover:text-[#B85C38] transition-colors leading-snug">
                  {c.name}
                </h3>
                <p className="text-xs font-semibold mb-3" style={{ color }}>
                  {c.specialty}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">{c.bio}</p>
                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden /> {c.basedIn}
                  </span>
                  <span className="text-xs font-semibold text-foreground">{c.yearsTeaching} yrs</span>
                </div>
                <Link
                  to="/creators"
                  className="mt-4 text-xs font-semibold flex items-center gap-1 transition-colors hover:gap-2"
                  style={{ color: QM_TEAL }}
                >
                  View profile <ChevronRight className="h-3 w-3" aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
