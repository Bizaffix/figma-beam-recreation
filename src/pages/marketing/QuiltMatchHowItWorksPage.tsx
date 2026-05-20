import { Link } from "react-router-dom";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";

function RoleColumn({
  color,
  eyebrow,
  steps,
}: {
  color: string;
  eyebrow: string;
  steps: [string, string][];
}) {
  return (
    <div>
      <span className={`font-mono text-[10px] uppercase tracking-widest ${color} mb-6 block`}>{eyebrow}</span>
      <ol className="space-y-8">
        {steps.map(([title, copy], i) => (
          <li key={title}>
            <span className="font-mono text-xs text-muted-foreground block mb-2">0{i + 1}</span>
            <h2 className="font-display text-xl mb-2">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{copy}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Quilt-match marketing page (see quilt-match/src/routes/how-it-works.tsx) */
export default function QuiltMatchHowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground quilt-match-home">
      <QuiltMatchSiteHeader />
      <main>
        <section className="px-6 pt-20 pb-16 max-w-4xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-6xl mb-6 text-balance">How QuiltMatch works</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three roles, one shared calendar. We handle bookings, payments, and the small details — so the focus
            stays on the craft.
          </p>
        </section>

        <section className="px-6 pb-24 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-x-6 gap-y-12 border-y border-border py-16">
            <RoleColumn
              color="text-sage"
              eyebrow="For Quilters"
              steps={[
                ["Tell us what you love", "Skill level, region, budget, and the kinds of retreats you dream about."],
                ["Discover & book", "Browse upcoming retreats. Pay 10% to hold your seat. We bill the balance 14 days before the event."],
                ["Bring friends", "Pay for additional headcount and send invite links — each seat collects its own dietary notes and skill level."],
              ]}
            />
            <RoleColumn
              color="text-rust"
              eyebrow="For Creators"
              steps={[
                ["Pick a venue & week", "Browse open weeks at venues across the US. Lock in the dates that fit."],
                ["Build the event in minutes", "AI drafts the description, schedule, packing list, and FAQ. Refine, then publish."],
                ["Get paid as you go", "We collect deposits and balances automatically. Fees start at 5% and drop to 4.5% as you grow."],
              ]}
            />
            <RoleColumn
              color="text-match-indigo"
              eyebrow="For Venues"
              steps={[
                ["Create your listing", "Upload photos. We auto-detect amenities and draft your space's story."],
                ["Post open weeks", "Mark the dates you have available. Get matched with creators looking for space."],
                ["Host & get paid", "12% booking fee. No listing fees, no subscriptions. You only pay when you get paid."],
              ]}
            />
          </div>
        </section>

        <section className="bg-muted/30 py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <span className="font-mono text-[10px] uppercase tracking-widest text-foreground mb-3 block">Pricing</span>
            <h2 className="font-display text-4xl mb-12">Transparent fees. No surprises.</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { who: "Quilter", fee: "$0", detail: "No platform fee. Pay 10% deposit, balance 14 days before." },
                { who: "Creator", fee: "5% → 4.5%", detail: "5% your first 3 events. 4.7% next 3. 4.5% after that." },
                { who: "Venue", fee: "12%", detail: "Booking fee only. No listing fees. No subscription." },
              ].map((p) => (
                <div key={p.who} className="border border-border bg-background p-8">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
                    {p.who}
                  </span>
                  <div className="font-display text-4xl mb-3">{p.fee}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.detail}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-8 max-w-2xl">
              Virtual classes and shop products are billed at 8%. US-only at launch. All payments processed securely
              through our payment partners.
            </p>
          </div>
        </section>

        <section className="py-24 px-6 max-w-4xl mx-auto">
          <h2 className="font-display text-4xl mb-12">Common questions</h2>
          <div className="space-y-8">
            {[
              [
                "When are payments collected?",
                "10% at booking, 90% balance auto-charged 14 days before the event start date. Group seats can be invited via email — each invitee provides their own info.",
              ],
              [
                "What's the cancellation policy?",
                "Set by the creator and shown clearly on every event page. Standard policy: full refund up to 30 days prior, 50% to 14 days prior, deposit non-refundable inside 14 days.",
              ],
              [
                "Do creators need their own venue?",
                "No — that's the point. Creators browse the open-weeks marketplace and book a venue right inside QuiltMatch.",
              ],
              [
                "How does moderation work?",
                "Listings publish instantly. Our moderation engine blocks incomplete or off-topic posts and gives creators a Listing Score with concrete suggestions to improve.",
              ],
              [
                "Where does QuiltMatch operate?",
                "United States only at launch. International expansion in 2027.",
              ],
            ].map(([q, a]) => (
              <div key={q} className="border-b border-border pb-8">
                <h3 className="font-display text-xl mb-3">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto border border-foreground p-12 text-center">
            <h2 className="font-display text-4xl mb-4">Ready to begin?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Pick the door that fits — quilter, creator, or venue. You can add a second role anytime.
            </p>
            <Link to="/signup" className="inline-block btn-primary px-8 py-3 text-sm font-medium">
              Create your account
            </Link>
          </div>
        </section>
      </main>
      <QuiltMatchSiteFooter />
    </div>
  );
}
