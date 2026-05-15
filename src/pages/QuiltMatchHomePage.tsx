import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, Award } from "lucide-react";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";
import { ListingCard } from "@/components/quilt-match-home/listing-card";
import { Avatar } from "@/components/quilt-match-home/avatar";
import { CreatorModal, VenueModal } from "@/components/quilt-match-home/profile-modals";
import { allRetreats, type Retreat } from "@/data/quiltMatchHomeRetreats";
import heroQuilter from "@/assets/quilt-match-home/hero-quilter.jpg";
import heroCreator from "@/assets/quilt-match-home/hero-creator.jpg";
import heroVenue from "@/assets/quilt-match-home/hero-venue.jpg";
import recapFeature from "@/assets/quilt-match-home/recap-feature.jpg";

const featuredRetreats = allRetreats.slice(0, 4);

const featuredCreators = (() => {
  const seen = new Set<string>();
  const out: typeof allRetreats = [];
  for (const r of allRetreats) {
    if (seen.has(r.creator.name)) continue;
    seen.add(r.creator.name);
    out.push(r);
    if (out.length === 4) break;
  }
  return out;
})();

const featuredVenues = (() => {
  const seen = new Set<string>();
  const out: typeof allRetreats = [];
  for (const r of allRetreats) {
    if (seen.has(r.venueProfile.name)) continue;
    seen.add(r.venueProfile.name);
    out.push(r);
    if (out.length === 4) break;
  }
  return out;
})();

const openWeeks = [
  { venue: "Spruce Hollow Lodge", location: "Vermont", week: "Oct 12" },
  { venue: "The Loomery", location: "Oregon", week: "Nov 04" },
  { venue: "Cedar Creek Hall", location: "North Carolina", week: "Jan 15" },
  { venue: "Wildflower Plains Inn", location: "Montana", week: "Oct 01" },
  { venue: "The Riverbend Studio", location: "Maine", week: "Sept 22" },
];

function CreatorCard({ r }: { r: Retreat }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="group flex flex-col">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-rust"
        aria-label={`${r.creator.name} — ${r.creator.specialty}`}
      >
        <div className="aspect-video bg-rust/5 mb-4 overflow-hidden relative flex items-center justify-center border border-border">
          <div className="scale-[2.2]">
            <Avatar initials={r.creator.initials} tone="rust" size="lg" />
          </div>
          <span className="absolute top-3 left-3 bg-rust text-rust-foreground text-[10px] font-mono uppercase tracking-wider px-2 py-1">
            Creator
          </span>
        </div>
      </button>

      <button type="button" onClick={() => setOpen(true)} className="group/title text-left">
        <h3 className="font-display text-xl mb-1 group-hover/title:text-rust transition-colors">
          {r.creator.name}
        </h3>
      </button>
      <p className="text-xs tracking-wide uppercase text-muted-foreground mb-3">
        {r.creator.specialty} · {r.creator.basedIn}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
        {r.creator.bio}
      </p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-3 border-t border-border">
        <div>
          <div className="font-display text-2xl text-rust leading-none">{r.creator.yearsTeaching}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1 flex items-center gap-1">
            <Award className="h-3 w-3" /> years teaching
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-primary px-4 py-2 text-xs font-medium whitespace-nowrap"
        >
          View profile →
        </button>
      </div>

      <CreatorModal retreat={r} open={open} onOpenChange={setOpen} />
    </article>
  );
}

function VenueCard({ r }: { r: Retreat }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="group flex flex-col">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-match-indigo"
        aria-label={`${r.venueProfile.name} in ${r.venueProfile.location}`}
      >
        <div className="aspect-video bg-muted mb-4 overflow-hidden relative">
          <img
            src={r.venueProfile.image}
            alt={`${r.venueProfile.name} in ${r.venueProfile.location}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
          <span className="absolute top-3 left-3 bg-match-indigo text-match-indigo-foreground text-[10px] font-mono uppercase tracking-wider px-2 py-1">
            Venue
          </span>
        </div>
      </button>

      <div className="flex items-center gap-3 mb-3">
        <Avatar initials={r.venueProfile.initials} tone="match-indigo" />
        <div className="text-[11px] leading-tight">
          <span className="block font-medium">{r.venueProfile.name}</span>
          <span className="block text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {r.venueProfile.location}
          </span>
        </div>
      </div>

      <button type="button" onClick={() => setOpen(true)} className="group/title text-left">
        <h3 className="font-display text-xl mb-1 group-hover/title:text-match-indigo transition-colors line-clamp-2">
          {r.venueProfile.description.split(".")[0]}.
        </h3>
      </button>
      <p className="text-xs tracking-wide uppercase text-muted-foreground mb-4">
        {r.venueProfile.amenities.slice(0, 2).join(" · ")}
      </p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-3 border-t border-border">
        <div>
          <div className="font-display text-2xl text-match-indigo leading-none">{r.venueProfile.capacity}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1 flex items-center gap-1">
            <Users className="h-3 w-3" /> sleeps
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center px-4 py-2 text-xs font-medium bg-match-indigo text-match-indigo-foreground hover:bg-match-indigo/90 transition-colors whitespace-nowrap"
        >
          View venue →
        </button>
      </div>

      <VenueModal retreat={r} open={open} onOpenChange={setOpen} />
    </article>
  );
}

export function QuiltMatchHomePage() {
  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground selection:bg-rust/20">
      <QuiltMatchSiteHeader />

      <main>
        <section className="pt-12 pb-24 px-6">
          <div className="max-w-7xl mx-auto text-center mb-16 animate-fade-up">
            <h1 className="font-display text-5xl md:text-7xl mb-6 text-balance tracking-tight">
              The Quilting Retreat Marketplace.
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              QuiltMatch is the quilting retreat marketplace where quilters discover inspiring creative getaways nationwide — and retreat hosts grow their business by reaching the right audience. Find retreats. Host experiences. Build community.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/retreats" className="btn-primary px-6 py-3 text-sm font-medium">Explore Retreats</Link>
              <Link to="/venues" className="px-6 py-3 text-sm font-medium border border-foreground hover:bg-foreground hover:text-background transition-colors">Become a Host</Link>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
            <RoleDoor
              eyebrow="For the Maker"
              eyebrowColor="text-sage"
              bg="bg-sage/5"
              imageBg="bg-sage/10"
              title="Find your next retreat"
              copy="Discover curated gatherings across the US, from coastal workshops to mountain lodges."
              cta="Browse retreats"
              image={heroQuilter}
              delay="100ms"
              priority
            />
            <RoleDoor
              eyebrow="For the Host"
              eyebrowColor="text-rust"
              bg="bg-rust/5"
              imageBg="bg-rust/10"
              title="Run a seamless event"
              copy="The tools you need to manage bookings, attendees, and logistics without the stress."
              cta="Start hosting"
              image={heroCreator}
              delay="200ms"
            />
            <RoleDoor
              eyebrow="For the Space"
              eyebrowColor="text-match-indigo"
              bg="bg-match-indigo/5"
              imageBg="bg-match-indigo/10"
              title="Fill your off-season"
              copy="Connect with creators looking for beautiful, inspiring locations for their guilds."
              cta="List venue"
              image={heroVenue}
              delay="300ms"
            />
          </div>
        </section>

        <section className="bg-match-indigo text-match-indigo-foreground py-8 overflow-hidden whitespace-nowrap border-y border-match-indigo/20">
          <div className="flex gap-16 animate-marquee">
            {[0, 1].map((i) => (
              <span key={i} className="font-mono text-xs uppercase tracking-[0.2em] flex items-center gap-4 shrink-0">
                Open weeks this season
                {openWeeks.map((w) => (
                  <span key={w.venue + i} className="flex items-center gap-4">
                    <span className="size-1 bg-match-indigo-foreground/50 rounded-full" />
                    {w.venue} ({w.location} · {w.week})
                  </span>
                ))}
              </span>
            ))}
          </div>
        </section>

        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-display text-4xl mb-2">Featured retreats</h2>
              <p className="text-muted-foreground">Upcoming gatherings curated by our community.</p>
            </div>
            <Link to="/retreats" className="text-sm font-medium text-rust hidden md:inline-block">
              View all retreats →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {featuredRetreats.map((r) => (
              <ListingCard key={r.id} r={r} />
            ))}
          </div>
        </section>

        <section className="py-24 px-6 max-w-7xl mx-auto border-t border-border">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-rust mb-3 block">
                Featured creators
              </span>
              <h2 className="font-display text-4xl mb-2">The makers leading the room</h2>
              <p className="text-muted-foreground">Teachers, designers, and quilters running the gatherings.</p>
            </div>
            <Link to="/creators" className="text-sm font-medium text-rust hidden md:inline-block">
              View all creators →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {featuredCreators.map((r) => (
              <CreatorCard key={r.creator.name} r={r} />
            ))}
          </div>
        </section>

        <section className="py-24 px-6 max-w-7xl mx-auto border-t border-border">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-match-indigo mb-3 block">
                Featured venues
              </span>
              <h2 className="font-display text-4xl mb-2">Spaces built for stitching</h2>
              <p className="text-muted-foreground">Lodges, studios, and inns hosting retreats this season.</p>
            </div>
            <Link to="/venues" className="text-sm font-medium text-match-indigo hidden md:inline-block">
              View all venues →
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {featuredVenues.map((r) => (
              <VenueCard key={r.venueProfile.name} r={r} />
            ))}
          </div>
        </section>

        <section className="py-24 bg-sage/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-12 gap-12 items-center">
              <div className="md:col-span-7">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={recapFeature}
                    alt="Quilt blocks laid out on a long wooden table after a recent retreat"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="md:col-span-5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-sage mb-6 block">
                  Recent stories
                </span>
                <blockquote className="font-display text-3xl md:text-4xl leading-tight mb-8">
                  &ldquo;There is a quiet rhythm to hand-stitching in a room full of people who share the same love for the craft.&rdquo;
                </blockquote>
                <p className="text-muted-foreground mb-8 italic">
                  — On gathering at The Spruce Hollow Retreat with Julia Chen.
                </p>
                <a
                  href="/recap"
                  className="inline-block px-8 py-4 border border-foreground text-sm font-medium hover:bg-foreground hover:text-background transition-colors"
                >
                  Read the full story
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-rust mb-4 block">For quilters</span>
              <h2 className="font-display text-2xl mb-4">Find quilting retreats near you</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Browse weekend quilting retreats, beginner-friendly workshops, and all-levels getaways. Filter by location, skill level, and dates — then book your spot in seconds.
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-sage mb-4 block">For hosts</span>
              <h2 className="font-display text-2xl mb-4">List a quilting retreat</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Reach quilters who are actively searching. The quilting retreat platform for hosts gives you listings, inquiries, and reviews in one dashboard — built to fill seats faster.
              </p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-match-indigo mb-4 block">For venues</span>
              <h2 className="font-display text-2xl mb-4">Fill the calendar you have</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Post the weeks you have open. Get matched with retreat organizers who fit your space. No listing fees, no subscriptions — you only pay when you get paid.
              </p>
            </div>
          </div>
        </section>
      </main>

      <QuiltMatchSiteFooter />
    </div>
  );
}

function RoleDoor({
  eyebrow,
  eyebrowColor,
  bg,
  imageBg,
  title,
  copy,
  cta,
  image,
  delay,
  priority,
}: {
  eyebrow: string;
  eyebrowColor: string;
  bg: string;
  imageBg: string;
  title: string;
  copy: string;
  cta: string;
  image: string;
  delay: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden ${bg} border border-border p-8 h-[440px] flex flex-col justify-between animate-fade-up`}
      style={{ animationDelay: delay }}
    >
      <div className="relative z-10">
        <span className={`font-mono text-[10px] uppercase tracking-widest ${eyebrowColor} mb-4 block`}>
          {eyebrow}
        </span>
        <h2 className="font-display text-3xl mb-4">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-[28ch]">{copy}</p>
      </div>
      <div className={`absolute bottom-0 right-0 w-2/3 h-48 ${imageBg} overflow-hidden`}>
        <img
          src={image}
          alt=""
          width={520}
          height={384}
          loading={priority ? "eager" : "lazy"}
          {...(priority ? { fetchPriority: "high" as const } : {})}
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
        />
      </div>
      <button type="button" className="relative z-10 self-start px-6 py-3 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors">
        {cta}
      </button>
    </div>
  );
}
