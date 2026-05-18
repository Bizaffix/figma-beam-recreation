import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { QM_CHARCOAL, QM_RUST } from "@/lib/quilt-match-home-brand";

const COMMUNITY_IMG =
  "https://images.unsplash.com/photo-1766932901295-d4185660341b?w=900&h=700&fit=crop&auto=format";

export function CommunityQuoteSection() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[460px]">
      <div className="relative min-h-[300px] lg:min-h-0 overflow-hidden">
        <img
          src={COMMUNITY_IMG}
          alt="Quilters attending a creative retreat hosted by an experienced quilt retreat organizer"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0" style={{ background: "rgba(58,107,110,0.18)" }} aria-hidden />
        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-white text-sm font-medium text-center bg-black/40 backdrop-blur-sm border border-white/20 rounded-[6px] px-4 py-2.5">
            Real retreats. Real hosts. Real community.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-10 md:px-16 py-20" style={{ background: QM_CHARCOAL }}>
        <span
          className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-7 block"
          style={{ color: QM_RUST }}
        >
          More Than a Booking
        </span>
        <p className="font-display text-2xl md:text-[1.75rem] italic font-light leading-relaxed mb-7 text-white/90">
          &ldquo;I was nervous going to my first retreat alone. By the second evening, I felt like I&apos;d known
          these women for years.&rdquo;
        </p>
        <p className="text-xs uppercase tracking-wider mb-9 text-white/45">— First-time attendee, Colorado</p>
        <Link
          to="/retreats"
          className="inline-flex items-center gap-2 text-sm font-semibold w-fit px-6 py-3 rounded-full border-2 transition-all hover:bg-white/10 hover:gap-3"
          style={{ color: QM_RUST, borderColor: "rgba(184,92,56,0.5)" }}
        >
          Join the community <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
