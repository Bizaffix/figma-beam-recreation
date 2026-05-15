import { Link, Navigate, useParams } from "react-router-dom";
import { ListingCard } from "@/components/quilt-match-home/listing-card";
import { regions, retreatsByRegion, type RegionSlug } from "@/data/quiltMatchHomeRetreats";

const validSlugs: RegionSlug[] = ["northeast", "south", "midwest", "mountain", "west-coast"];

export default function QuiltMatchRetreatsRegionPage() {
  const { region } = useParams<{ region: string }>();
  const slug = region as RegionSlug | undefined;

  if (!slug || !validSlugs.includes(slug)) {
    return <Navigate to="/retreats" replace />;
  }

  const regionMeta = regions[slug];
  const retreats = retreatsByRegion(slug);

  return (
    <main>
      <section className="px-6 pt-16 pb-10 max-w-7xl mx-auto">
        <nav className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          <Link to="/retreats" className="hover:text-foreground">
            Retreats
          </Link>
          <span className="mx-2">/</span>
          <span className="text-rust">{regionMeta.label}</span>
        </nav>
        <h1 className="font-display text-5xl md:text-6xl mb-6 max-w-3xl text-balance">
          Quilt retreats in the {regionMeta.label}.
        </h1>
        <p className="text-muted-foreground max-w-2xl mb-4">{regionMeta.description}</p>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-12">
          Covering: {regionMeta.states}
        </p>
      </section>

      <section className="px-6 pb-24 max-w-7xl mx-auto">
        {retreats.length === 0 ? (
          <p className="text-muted-foreground">
            No retreats currently scheduled in this region.{" "}
            <Link to="/retreats" className="underline">
              Browse all regions
            </Link>
            .
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {retreats.map((r) => (
              <ListingCard key={r.id} r={r} />
            ))}
          </div>
        )}

        <div className="mt-20 border-t border-border pt-12">
          <h2 className="font-display text-2xl mb-6">Browse other regions</h2>
          <div className="flex flex-wrap gap-3">
            {validSlugs
              .filter((s) => s !== slug)
              .map((s) => (
                <Link
                  key={s}
                  to={`/retreats/${s}`}
                  className="px-4 py-2 border border-border text-sm hover:border-foreground/40"
                >
                  {regions[s].label} →
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}
