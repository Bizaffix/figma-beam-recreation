import { Link } from "react-router-dom";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";

export default function QuiltMatchGuideWhatIsPage() {
  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground">
      <QuiltMatchSiteHeader />
      <main className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <nav className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-6">
          <Link to="/retreats" className="hover:text-foreground">
            Retreats
          </Link>
          <span className="mx-2">/</span>
          <span className="text-rust">Guides</span>
        </nav>
        <span className="font-mono text-[10px] uppercase tracking-widest text-sage mb-4 block">
          First-timer&apos;s guide
        </span>
        <h1 className="font-display text-4xl md:text-5xl mb-8 text-balance">What is a quilt retreat?</h1>

        <div className="space-y-6 text-foreground max-w-none">
          <p className="text-xl leading-relaxed text-muted-foreground mb-8">
            A quilt retreat is a multi-day gathering — usually two to five days — where quilters travel to a
            shared space to sew, learn from an instructor, and spend uninterrupted time on their craft
            alongside other makers.
          </p>

          <h2 className="font-display text-2xl mt-12 mb-4">The basic format</h2>
          <p className="leading-relaxed mb-4">
            Most quilt retreats follow a similar rhythm: arrive on a Thursday or Friday, settle into your
            space, then spend the next several days at long sewing tables with everything you need within
            arm&apos;s reach. Meals are shared. Evenings often include show-and-tell, fabric swaps, or guest
            lectures.
          </p>

          <h2 className="font-display text-2xl mt-12 mb-4">Two common styles</h2>
          <p className="leading-relaxed mb-4">
            <strong>Workshop retreats</strong> are taught by a specific instructor — you&apos;ll work on a
            defined project (a quilt block, a technique, a finished top) with structured lessons and
            one-on-one guidance.
          </p>
          <p className="leading-relaxed mb-4">
            <strong>Open-sew retreats</strong> give you the space, the table, and the company without a
            structured class. Bring whatever you&apos;re working on. These are popular with experienced
            quilters who want focused time on their own pieces.
          </p>

          <h2 className="font-display text-2xl mt-12 mb-4">What it usually costs</h2>
          <p className="leading-relaxed mb-4">
            US quilt retreats typically range from <strong>$450 for a long weekend</strong> at a regional
            venue to <strong>$1,500+ for a week-long workshop</strong> with a well-known instructor at a
            destination property. Lodging and most meals are usually included. Materials and shipping are
            usually not.
          </p>

          <h2 className="font-display text-2xl mt-12 mb-4">How to choose your first one</h2>
          <ul className="space-y-2 mb-6 list-none pl-0">
            <li>
              <strong>Start close to home.</strong> A regional retreat lets you test the format without a
              long flight.
            </li>
            <li>
              <strong>Pick a skill level honestly.</strong> &quot;All levels&quot; really does mean all
              levels; &quot;advanced&quot; assumes confident piecing.
            </li>
            <li>
              <strong>Look at the table size.</strong> A 6-foot personal sewing table per quilter is the
              comfortable standard.
            </li>
            <li>
              <strong>Read the meal plan.</strong> Some retreats are catered; others are potluck-style.
              Both are great — but know which you&apos;re signing up for.
            </li>
          </ul>

          <h2 className="font-display text-2xl mt-12 mb-4">Ready to find one?</h2>
          <p className="leading-relaxed mb-8">
            QuiltMatch lists quilt retreats across the United States. Browse by region, skill, or season —
            or read up on what to pack before you go.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/retreats" className="inline-block btn-primary px-6 py-3 text-sm font-medium">
              Browse all retreats
            </Link>
            <Link
              to="/guides/what-to-bring"
              className="inline-block px-6 py-3 border border-foreground text-sm font-medium hover:bg-foreground hover:text-background transition-colors"
            >
              What to bring →
            </Link>
          </div>
        </div>
      </main>
      <QuiltMatchSiteFooter />
    </div>
  );
}
