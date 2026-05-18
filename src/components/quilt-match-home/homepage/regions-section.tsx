import { Link } from "react-router-dom";
import { allRetreats, type RegionSlug } from "@/data/quiltMatchHomeRetreats";
import { QM_TEAL } from "@/lib/quilt-match-home-brand";

const HOME_REGIONS: {
  name: string;
  slug: RegionSlug;
  link: string;
  image: string;
}[] = [
  {
    name: "Pacific Northwest",
    slug: "west-coast",
    link: "/retreats/in/or",
    image: "https://images.unsplash.com/photo-1762067412033-83b4420574a3?w=500&h=440&fit=crop&auto=format",
  },
  {
    name: "New England",
    slug: "northeast",
    link: "/retreats/in/vt",
    image: "https://images.unsplash.com/photo-1698389212683-ddee43c36c17?w=500&h=440&fit=crop&auto=format",
  },
  {
    name: "The South",
    slug: "south",
    link: "/retreats/in/nc",
    image: "https://images.unsplash.com/photo-1760648998657-bf3e8e8a380f?w=500&h=440&fit=crop&auto=format",
  },
  {
    name: "Mountain West",
    slug: "mountain",
    link: "/retreats/in/mt",
    image: "https://images.unsplash.com/photo-1770090288776-1b9ca3fac4b8?w=500&h=440&fit=crop&auto=format",
  },
];

function countForRegion(slug: RegionSlug) {
  return allRetreats.filter((r) => r.region === slug).length;
}

export function RegionsSection() {
  return (
    <section className="py-20 px-5 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: QM_TEAL }}>
            Explore
          </p>
          <h2 className="font-display text-4xl md:text-[2.6rem] font-bold text-foreground">Find retreats near you</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {HOME_REGIONS.map((region) => (
            <Link
              key={region.name}
              to={region.link}
              className="group relative aspect-[3/4] block overflow-hidden rounded-[8px] bg-secondary shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                src={region.image}
                alt={region.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(44,42,39,0.85) 0%, rgba(44,42,39,0.15) 55%, transparent 100%)",
                }}
              />
              <div className="absolute bottom-0 p-6 text-white">
                <h3 className="font-display text-xl font-bold mb-1 leading-tight">{region.name}</h3>
                <p className="text-sm opacity-75">{countForRegion(region.slug)} retreats</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
