import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { QM_TEAL, QM_RUST, QM_AMBER, QM_CHARCOAL } from "@/lib/quilt-match-home-brand";

export function FinalCtaSection() {
  return (
    <section className="py-24 px-5" style={{ background: QM_CHARCOAL }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-[10px] p-8 text-center hover:border-white/20 transition-colors">
            <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-3 leading-tight">
              Ready to find your next retreat?
            </h3>
            <p className="text-white/65 mb-6 text-sm leading-relaxed">
              Browse hundreds of quilting experiences nationwide.
            </p>
            <Link
              to="/retreats"
              className="inline-flex items-center justify-center gap-2 text-white px-6 py-3.5 text-sm font-semibold rounded-[6px] transition-opacity w-full shadow-lg hover:opacity-90"
              style={{ background: QM_TEAL }}
            >
              Explore Retreats <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-[10px] p-8 text-center hover:border-white/20 transition-colors">
            <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-3 leading-tight">
              Ready to share your passion?
            </h3>
            <p className="text-white/65 mb-6 text-sm leading-relaxed">
              Create retreats and build a business teaching quilters.
            </p>
            <Link
              to="/creators"
              className="inline-flex items-center justify-center gap-2 text-white px-6 py-3.5 text-sm font-semibold rounded-[6px] transition-opacity w-full shadow-lg hover:opacity-90"
              style={{ background: QM_RUST }}
            >
              Start Creating <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-[10px] p-8 text-center hover:border-white/20 transition-colors">
            <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-3 leading-tight">
              Ready to fill your calendar?
            </h3>
            <p className="text-white/65 mb-6 text-sm leading-relaxed">
              Host quilting retreats and fill your mid-week slots.
            </p>
            <Link
              to="/venues"
              className="inline-flex items-center justify-center gap-2 text-white px-6 py-3.5 text-sm font-semibold rounded-[6px] transition-opacity w-full shadow-lg hover:opacity-90"
              style={{ background: QM_AMBER }}
            >
              List Your Space <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
