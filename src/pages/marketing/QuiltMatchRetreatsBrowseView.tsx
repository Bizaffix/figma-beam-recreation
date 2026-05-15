import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RetreatAiSearch } from "@/components/quilt-match-home/retreat-ai-search";
import { RetreatFiltersPanel } from "@/components/quilt-match-home/retreat-filters-panel";
import { ListingCard } from "@/components/quilt-match-home/listing-card";
import { allRetreats } from "@/data/quiltMatchHomeRetreats";
import { getExtras } from "@/data/quiltMatchRetreatExtras";
import {
  initialFiltersFromSeed,
  lengthBucketFor,
  type RetreatFilters,
} from "@/lib/quilt-match-retreat-filters";

export type QuiltMatchRetreatsBrowseViewProps = {
  seedFilters?: Partial<RetreatFilters>;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function QuiltMatchRetreatsBrowseView({
  seedFilters,
  eyebrow = "Retreats",
  title = "Find a quilt retreat that fits — exactly.",
  description = `Filter by state, price, length, class focus, amenities, accessibility, included
            experiences, food, and rooming — or just tell our concierge what you're after.`,
}: QuiltMatchRetreatsBrowseViewProps) {
  const [filters, setFilters] = useState<RetreatFilters>(() => initialFiltersFromSeed(seedFilters));
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const availableStates = useMemo(
    () => Array.from(new Set(allRetreats.map((r) => r.state))).sort(),
    [],
  );

  const priceBounds = useMemo(() => {
    const prices = allRetreats.map((r) => r.priceNumber);
    return {
      min: Math.floor(Math.min(...prices) / 100) * 100,
      max: Math.ceil(Math.max(...prices) / 100) * 100,
    };
  }, []);

  const filtered = useMemo(() => {
    return allRetreats.filter((r) => {
      const x = getExtras(r.id);
      if (!x) return false;

      if (filters.region !== "all" && r.region !== filters.region) return false;
      if (filters.states.length && !filters.states.includes(r.state)) return false;
      if (r.priceNumber < filters.priceMin || r.priceNumber > filters.priceMax) return false;
      if (filters.lengths.length && !filters.lengths.includes(lengthBucketFor(x.lengthDays)))
        return false;
      if (filters.focuses.length && !filters.focuses.includes(x.focus)) return false;
      if (filters.amenities.length && !filters.amenities.every((a) => x.amenities.includes(a)))
        return false;

      if (filters.ada.stepFreeAccess && !x.ada.stepFreeAccess) return false;
      if (filters.ada.accessibleRoom && !x.ada.accessibleRoom) return false;
      if (filters.ada.accessibleBathroom && !x.ada.accessibleBathroom) return false;
      if (filters.ada.elevator && !x.ada.elevator) return false;

      if (
        filters.experiences.length &&
        !filters.experiences.every((e) => x.experiences.includes(e))
      )
        return false;

      if (filters.foodIncluded !== null && x.food.included !== filters.foodIncluded) return false;
      if (filters.foodStyles.length && !filters.foodStyles.includes(x.food.style)) return false;
      if (filters.kitchenAccess !== null && x.food.kitchenAccess !== filters.kitchenAccess)
        return false;
      if (filters.dietary.length && !filters.dietary.every((d) => x.food.dietary.includes(d)))
        return false;

      if (filters.privateRoomAvailable === true && !x.rooming.privateRoomAvailable) return false;
      if (filters.okWithSharedRoom === false && x.rooming.sharedOnly) return false;

      return true;
    });
  }, [filters]);

  const reset = () => {
    setFilters(initialFiltersFromSeed(seedFilters));
    setAiSummary(null);
  };

  return (
    <main>
      <section className="px-6 pt-12 pb-8 max-w-7xl mx-auto">
        <span className="font-mono text-[10px] uppercase tracking-widest text-rust mb-3 block">
          {eyebrow}
        </span>
        <h1 className="font-display text-4xl md:text-5xl mb-4 max-w-3xl text-balance">{title}</h1>
        <p className="text-muted-foreground max-w-2xl mb-8">{description}</p>

        <RetreatAiSearch
          onApplyFilters={(f, summary) => {
            setFilters(f);
            setAiSummary(summary);
          }}
        />
      </section>

      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="border border-border px-4 py-2 text-xs font-mono uppercase tracking-wider"
          >
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {filtered.length}/{allRetreats.length}
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-10">
          <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Filters
              </p>
              <button
                type="button"
                onClick={reset}
                className="text-[11px] underline text-muted-foreground hover:text-rust"
              >
                Clear all
              </button>
            </div>
            <RetreatFiltersPanel
              filters={filters}
              setFilters={setFilters}
              availableStates={availableStates}
              priceBounds={priceBounds}
            />
          </div>

          <div>
            <div className="hidden lg:flex items-center justify-between mb-6">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Showing {filtered.length} of {allRetreats.length} retreats
              </p>
              {aiSummary && (
                <p className="text-xs text-muted-foreground italic max-w-md text-right">
                  {aiSummary}
                </p>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground mb-4">No retreats match these filters.</p>
                <button type="button" onClick={reset} className="btn-primary px-6 py-2 text-sm">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-12">
                {filtered.map((r) => (
                  <ListingCard key={r.id} r={r} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-2 gap-6">
          <Link
            to="/guides/what-is-a-quilt-retreat"
            className="border border-border p-8 hover:border-foreground/40 transition-colors"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-sage mb-3 block">
              Guide
            </span>
            <h3 className="font-display text-2xl mb-2">What is a quilt retreat?</h3>
            <p className="text-sm text-muted-foreground">
              A first-timer's guide to gathering, stitching, and what to expect.
            </p>
          </Link>
          <Link
            to="/guides/what-to-bring"
            className="border border-border p-8 hover:border-foreground/40 transition-colors"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-sage mb-3 block">
              Guide
            </span>
            <h3 className="font-display text-2xl mb-2">What to bring to a quilt retreat</h3>
            <p className="text-sm text-muted-foreground">
              A packing list from veteran retreat-goers — tools, fabric, and the small comforts.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
