import { Link } from "react-router-dom";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";

const lists = [
  {
    title: "The machine kit",
    items: [
      "Sewing machine + power cord (and a backup cord if you have one)",
      "Foot pedal + extension cord",
      "Pre-wound bobbins (10+ — you'll thank yourself)",
      "Spare needles in the sizes you actually use (80/12 universal, 90/14 quilting)",
      "Small screwdriver, lint brush, and the manual",
      "Machine cover or pillowcase for transport",
    ],
  },
  {
    title: "Cutting & pressing",
    items: [
      "Rotary cutter + spare blades",
      "Cutting mat (most retreats provide larger ones — bring a 12x18 personal mat)",
      'Acrylic ruler (a 6.5" square + a 6"x24" cover most needs)',
      "Small travel iron (some venues provide; check first)",
      "Scissors — both fabric and thread",
    ],
  },
  {
    title: "Sewing notions",
    items: [
      "Pins and a magnetic pin dish",
      "Wonder clips for binding",
      "Seam ripper (bring two, lose one)",
      "Marking tools — chalk, washable pen, Hera marker",
      "Thread in your project's main color + neutrals",
    ],
  },
  {
    title: "The project itself",
    items: [
      "Pattern, printed and tabbed",
      "Pre-cut or pre-washed fabric (cutting at the retreat eats the day)",
      "Backing and binding fabric if you'll get that far",
      "Batting if the project requires it",
    ],
  },
  {
    title: "Comforts veterans never skip",
    items: [
      "An extension cord and power strip — outlets are always scarce",
      "A small lamp or clip light (overhead lighting is rarely enough)",
      "A water bottle and a snack stash",
      "Comfortable shoes — you'll be on your feet pressing more than you think",
      "A shawl or layer (sewing rooms run cold)",
      "A notebook for ideas and the inevitable show-and-tell",
    ],
  },
];

export default function QuiltMatchGuideWhatToBringPage() {
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
          Packing list
        </span>
        <h1 className="font-display text-4xl md:text-5xl mb-8 text-balance">
          What to bring to a quilt retreat.
        </h1>
        <p className="text-xl leading-relaxed text-muted-foreground mb-12">
          A practical packing list built from veteran retreat-goers — what you actually need, what venues
          usually provide, and the small comforts that make the difference between a long weekend and a
          great one.
        </p>

        <div className="space-y-12">
          {lists.map((group) => (
            <section key={group.title}>
              <h2 className="font-display text-2xl mb-4 border-b border-border pb-2">{group.title}</h2>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span className="text-rust mt-2 size-1 rounded-full bg-rust shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-16 border border-border p-8">
          <h3 className="font-display text-2xl mb-3">First time at a retreat?</h3>
          <p className="text-muted-foreground mb-6">
            Read our first-timer&apos;s guide to learn what actually happens day-to-day, what costs to
            expect, and how to pick the right one for your skill level.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/guides/what-is-a-quilt-retreat"
              className="inline-block btn-primary px-6 py-3 text-sm font-medium"
            >
              What is a quilt retreat?
            </Link>
            <Link
              to="/retreats"
              className="inline-block px-6 py-3 border border-foreground text-sm font-medium hover:bg-foreground hover:text-background transition-colors"
            >
              Browse retreats →
            </Link>
          </div>
        </div>
      </main>
      <QuiltMatchSiteFooter />
    </div>
  );
}
