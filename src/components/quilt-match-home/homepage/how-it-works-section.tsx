import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { QM_TEAL, QM_RUST, QM_TEAL_LIGHT, QM_RUST_LIGHT } from "@/lib/quilt-match-home-brand";

const QUILTER_ITEMS = [
  { icon: "🔍", label: "Find", text: "retreats by location, skill level, and style" },
  { icon: "✨", label: "Discover", text: "new techniques and inspiration" },
  { icon: "📚", label: "Learn", text: "from experienced teachers and makers" },
  { icon: "🤝", label: "Connect", text: "with a passionate quilting community" },
];

const CREATOR_ITEMS = [
  { icon: "✨", label: "Create", text: "events that spark joy and creativity" },
  { icon: "💺", label: "Fill seats", text: "with targeted marketing to active quilters" },
  { icon: "📈", label: "Build", text: "a business on your passion for teaching" },
  { icon: "🛍️", label: "Sell", text: "patterns, products, and experiences" },
];

const HOST_ITEMS = [
  { icon: "📅", label: "Fill", text: "your calendar with engaged quilters" },
  { icon: "⏰", label: "Book", text: "mid-week and off-season open slots" },
  { icon: "🏡", label: "Host", text: "quilters who are respectful renters" },
  { icon: "💰", label: "Earn", text: "with no upfront fees or subscriptions" },
];

function RoleCard({
  badge,
  badgeStyle,
  items,
  cta,
  ctaStyle,
  to,
  hoverBorder,
}: {
  badge: string;
  badgeStyle: { background: string; color: string };
  items: { icon: string; label: string; text: string }[];
  cta: string;
  ctaStyle: { background: string };
  to: string;
  hoverBorder: string;
}) {
  return (
    <div
      className={`flex flex-col h-full border-2 border-border bg-card rounded-[10px] p-8 hover:shadow-lg ${hoverBorder} transition-all`}
    >
      <span
        className="inline-block text-[11px] uppercase tracking-[0.14em] font-bold px-3.5 py-2 rounded-full mb-6 shrink-0"
        style={badgeStyle}
      >
        {badge}
      </span>
      <div className="flex flex-col flex-1 space-y-4 min-h-0">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <span className="text-xl shrink-0 leading-none" aria-hidden>
              {item.icon}
            </span>
            <p className="text-sm leading-relaxed pt-0.5">
              <strong className="font-bold text-foreground">{item.label}</strong>{" "}
              <span className="text-muted-foreground">{item.text}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-6 w-full shrink-0">
        <Link
          to={to}
          className="grid place-items-center w-full rounded-[6px] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 no-underline"
          style={ctaStyle}
        >
          <span className="inline-flex items-center gap-2">
            {cta}
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          </span>
        </Link>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="py-20 px-5 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-[2.6rem] font-bold text-foreground mb-4">
            One Platform <span className="text-muted-foreground mx-2">/</span> Three Experiences
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
            Whether you&apos;re finding retreats, creating experiences, or hosting events — QuiltMatch connects the
            entire quilting community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <RoleCard
            badge="For Quilters"
            badgeStyle={{ background: QM_TEAL_LIGHT, color: QM_TEAL }}
            items={QUILTER_ITEMS}
            cta="Explore Retreats"
            ctaStyle={{ background: QM_TEAL }}
            to="/retreats"
            hoverBorder="hover:border-[#3A6B6E]/30"
          />
          <RoleCard
            badge="For Creators"
            badgeStyle={{ background: QM_RUST_LIGHT, color: QM_RUST }}
            items={CREATOR_ITEMS}
            cta="Start Creating"
            ctaStyle={{ background: QM_RUST }}
            to="/creators"
            hoverBorder="hover:border-[#B85C38]/30"
          />
          <RoleCard
            badge="For Venue Hosts"
            badgeStyle={{ background: QM_TEAL_LIGHT, color: QM_TEAL }}
            items={HOST_ITEMS}
            cta="List Your Space"
            ctaStyle={{ background: QM_TEAL }}
            to="/venues"
            hoverBorder="hover:border-[#3A6B6E]/30"
          />
        </div>
      </div>
    </section>
  );
}
