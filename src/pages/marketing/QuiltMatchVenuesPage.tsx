import { Link } from "react-router-dom";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";
import heroVenue from "@/assets/quilt-match-home/hero-venue.jpg";
import retreat1 from "@/assets/quilt-match-home/retreat-1.jpg";
import retreat3 from "@/assets/quilt-match-home/retreat-3.jpg";

const venues = [
  { name: "Spruce Hollow Lodge", initials: "SH", location: "Stowe, VT", capacity: 14, openWeek: "Oct 12", rate: "$3,200/wk", image: retreat1 },
  { name: "Cedar Creek Hall", initials: "CC", location: "Asheville, NC", capacity: 22, openWeek: "Jan 15", rate: "$4,100/wk", image: retreat3 },
  { name: "The Loomery Studio", initials: "LS", location: "Hood River, OR", capacity: 12, openWeek: "Nov 04", rate: "$2,800/wk", image: heroVenue },
  { name: "Wildflower Plains Inn", initials: "WP", location: "Bozeman, MT", capacity: 16, openWeek: "Apr 22", rate: "$3,600/wk", image: retreat1 },
];

export default function QuiltMatchVenuesPage() {
  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground">
      <QuiltMatchSiteHeader />
      <main>
        <section className="grid md:grid-cols-2 min-h-[60vh] border-b border-border">
          <div className="px-6 md:px-12 py-20 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-match-indigo mb-4">For the Space</span>
            <h1 className="font-display text-5xl md:text-6xl mb-6 text-balance">Quilt retreat venues across the US.</h1>
            <p className="text-muted-foreground mb-8 max-w-lg">
              Post your open weeks. Get matched with creators who fit your space. 12% booking fee, no listing fees, no subscriptions — you only pay when you get paid.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="btn-primary px-8 py-3 text-sm font-medium">List your venue</Link>
              <Link to="/how-it-works" className="btn-outline px-8 py-3 text-sm font-medium">How it works</Link>
            </div>
          </div>
          <div className="bg-match-indigo/10">
            <img src={heroVenue} alt="A sunlit quilting hall set up for a retreat" className="w-full h-full object-cover min-h-[40vh] md:min-h-full" />
          </div>
        </section>

        <section className="px-6 py-24 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-match-indigo mb-3 block">Open weeks</span>
              <h2 className="font-display text-4xl">Spaces looking for a creator</h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">Creators: claim a week and we&apos;ll help you fill the seats.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {venues.map((v) => (
              <article key={v.name} className="group flex flex-col">
                <Link to="/signup" className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-match-indigo">
                  <div className="aspect-video bg-muted mb-4 overflow-hidden">
                    <img src={v.image} alt={`${v.name} in ${v.location}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  </div>
                </Link>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-full bg-match-indigo/15 text-match-indigo flex items-center justify-center font-mono font-semibold text-xs ring-2 ring-background">
                    {v.initials}
                  </div>
                  <div className="text-[11px] leading-tight">
                    <span className="block font-medium">{v.name}</span>
                    <span className="block text-muted-foreground">{v.location}</span>
                  </div>
                </div>
                <p className="text-xs tracking-wide uppercase text-muted-foreground mb-4">Open: {v.openWeek} · Sleeps {v.capacity}</p>
                <div className="mt-auto flex items-end justify-between gap-3 pt-3 border-t border-border">
                  <div>
                    <div className="font-display text-2xl text-match-indigo leading-none">{v.rate}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">venue rental · 12% fee</div>
                  </div>
                  <Link to="/signup" className="bg-match-indigo text-match-indigo-foreground hover:bg-match-indigo/90 transition-colors px-4 py-2 text-xs font-medium whitespace-nowrap">
                    Inquire →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-match-indigo/5 py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-4xl mb-12 max-w-2xl">A simple way to fill your slow season.</h2>
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { n: "01", t: "List in minutes", c: "Upload photos and we'll auto-detect amenities, draft your description, and surface improvements with a Listing Score." },
                { n: "02", t: "Post open weeks", c: "Share the dates you have available — appear in the open-weeks marquee on the homepage and in creator search." },
                { n: "03", t: "Get paid on time", c: "10% deposit at booking, balance billed automatically 14 days prior. We handle invoicing, refunds, and dispute support." },
              ].map((b) => (
                <div key={b.n}>
                  <span className="font-mono text-xs text-match-indigo mb-3 block">{b.n}</span>
                  <h3 className="font-display text-2xl mb-3">{b.t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.c}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <QuiltMatchSiteFooter />
    </div>
  );
}
