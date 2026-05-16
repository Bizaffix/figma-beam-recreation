import { Link } from "react-router-dom";
import { ListingCard } from "@/components/quilt-match-home/listing-card";
import { retreatsByYear } from "@/data/quiltMatchHomeRetreats";

export default function QuiltMatchRetreats2026Page() {
  const retreats = retreatsByYear(2026);

  return (
    <main>
      <section className="px-6 pt-16 pb-10 max-w-7xl mx-auto">
        <nav className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          <Link to="/retreats" className="hover:text-foreground">
            Retreats
          </Link>
          <span className="mx-2">/</span>
          <span className="text-rust">2026</span>
        </nav>
        <h1 className="font-display text-5xl md:text-6xl mb-6 max-w-3xl text-balance">
          Quilt retreats in 2026.
        </h1>
        <p className="text-muted-foreground max-w-2xl mb-12">
          The full 2026 calendar of US quilt retreats — from spring prairie workshops to autumn lodge
          intensives. New retreats are added as creators publish their dates.
        </p>
      </section>

      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
          {retreats.map((r) => (
            <ListingCard key={r.id} r={r} />
          ))}
        </div>

        <div className="mt-20 border border-border p-12 text-center">
          <h3 className="font-display text-3xl mb-3">Looking further out?</h3>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Browse all upcoming retreats including 2027 dates already on the calendar.
          </p>
          <Link to="/retreats" className="inline-block btn-primary px-8 py-3 text-sm font-medium">
            View all retreats
          </Link>
        </div>
      </section>
    </main>
  );
}
