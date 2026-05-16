import { Link } from "react-router-dom";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";
import heroCreator from "@/assets/quilt-match-home/hero-creator.jpg";
import retreat2 from "@/assets/quilt-match-home/retreat-2.jpg";
import retreat4 from "@/assets/quilt-match-home/retreat-4.jpg";

const creators = [
  { name: "Sarah Hennessy", specialty: "Modern geometrics", events: 24, image: retreat2, bio: "Brooklyn-based teacher specializing in bold, graphic quilt design." },
  { name: "Elena Roux", specialty: "Natural dye & appliqué", events: 18, image: retreat4, bio: "PNW dyer & quilter exploring color from the garden." },
  { name: "Martha King", specialty: "Heirloom traditions", events: 41, image: retreat2, bio: "Three generations of Appalachian quilting wisdom, taught with care." },
  { name: "Julia Chen", specialty: "Scrap & improv", events: 12, image: retreat4, bio: "Texas Hill Country host of intimate winter masterclasses." },
];

export default function QuiltMatchCreatorsPage() {
  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground">
      <QuiltMatchSiteHeader />
      <main>
        <section className="px-6 pt-20 pb-16 max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-rust mb-4 block">For the Host</span>
            <h1 className="font-display text-5xl md:text-6xl mb-6 text-balance">Quilt retreat creators & educators.</h1>
            <p className="text-muted-foreground mb-8 max-w-lg">
              An AI-assisted event builder, a built-in audience of quilters, and platform fees that drop as you grow — from 5% to 4.5% as you build a reputation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="btn-primary px-8 py-3 text-sm font-medium">Start hosting</Link>
              <Link to="/how-it-works" className="px-8 py-3 border border-foreground text-sm font-medium hover:bg-foreground hover:text-background transition-colors">How it works</Link>
            </div>
          </div>
          <div className="md:col-span-6 aspect-[4/5] overflow-hidden bg-rust/10">
            <img src={heroCreator} alt="A creator setting up for a retreat workshop" className="w-full h-full object-cover" />
          </div>
        </section>

        <section className="bg-rust/5 py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <span className="font-mono text-[10px] uppercase tracking-widest text-rust mb-3 block">Featured creators</span>
            <h2 className="font-display text-4xl mb-12">The makers behind the gatherings.</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {creators.map((c) => (
                <article key={c.name}>
                  <div className="aspect-square bg-muted mb-6 overflow-hidden">
                    <img src={c.image} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-rust block mb-2">{c.specialty}</span>
                  <h3 className="font-display text-xl mb-2">{c.name}</h3>
                  <p className="text-sm text-muted-foreground italic mb-3">{c.bio}</p>
                  <p className="text-xs tracking-wide uppercase text-muted-foreground">{c.events} retreats hosted</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6 max-w-7xl mx-auto">
          <h2 className="font-display text-4xl mb-12 max-w-2xl">Tools that do the busywork for you.</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {[
              { t: "AI event builder", c: "Describe your retreat in a sentence. We draft the title, schedule, packing list, FAQ, and pricing tiers — pulling venue details automatically." },
              { t: "Auto-generated recap pages", c: "After every retreat, photos cluster into a beautiful story page that drives quilters to your next event. SEO-tuned. Indexed in days." },
              { t: "Duplicate & improve", c: "Run the same retreat twice a year? Duplicate in one click. Tweak details. Listing Score tells you exactly how to improve." },
              { t: "Co-host & referrals", c: "Bring in another creator and split fees automatically. Refer a venue or guest creator and earn ongoing platform credit." },
            ].map((b) => (
              <div key={b.t} className="border-l-2 border-rust pl-6">
                <h3 className="font-display text-2xl mb-3">{b.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.c}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <QuiltMatchSiteFooter />
    </div>
  );
}
