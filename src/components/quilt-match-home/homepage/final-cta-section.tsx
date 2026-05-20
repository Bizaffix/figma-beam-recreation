import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { QM_TEAL, QM_RUST, QM_CHARCOAL } from "@/lib/quilt-match-home-brand";

function CtaCard({
  title,
  description,
  cta,
  to,
  buttonColor,
}: {
  title: string;
  description: string;
  cta: string;
  to: string;
  buttonColor: string;
}) {
  return (
    <div className="flex flex-col h-full border border-white/10 bg-white/5 backdrop-blur-sm rounded-[10px] p-8 text-center hover:border-white/20 transition-colors">
      <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-3 leading-tight shrink-0">
        {title}
      </h3>
      <p className="text-white/65 text-sm leading-relaxed flex-1 min-h-[2.75rem]">{description}</p>
      <Link
        to={to}
        className="mt-6 grid place-items-center w-full rounded-[6px] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90 no-underline shrink-0"
        style={{ background: buttonColor }}
      >
        <span className="inline-flex items-center gap-2">
          {cta}
          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </span>
      </Link>
    </div>
  );
}

export function FinalCtaSection() {
  return (
    <section className="py-24 px-5" style={{ background: QM_CHARCOAL }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <CtaCard
            title="Ready to find your next retreat?"
            description="Browse hundreds of quilting experiences nationwide."
            cta="Explore Retreats"
            to="/retreats"
            buttonColor={QM_TEAL}
          />
          <CtaCard
            title="Ready to share your passion?"
            description="Create retreats and build a business teaching quilters."
            cta="Start Creating"
            to="/creators"
            buttonColor={QM_RUST}
          />
          <CtaCard
            title="Ready to fill your calendar?"
            description="Host quilting retreats and fill your mid-week slots."
            cta="List Your Space"
            to="/venues"
            buttonColor={QM_TEAL}
          />
        </div>
      </div>
    </section>
  );
}
