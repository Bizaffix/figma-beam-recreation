import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroMain from "@/assets/quilt-match-home/hero-quilter.jpg";
import heroAccent1 from "@/assets/quilt-match-home/hero-creator.jpg";
import heroAccent2 from "@/assets/quilt-match-home/hero-venue.jpg";

export function QuiltMatchHeroSection() {
  return (
    <section className="relative grid grid-cols-1 lg:grid-cols-[55%_45%] min-h-0 lg:min-h-[85vh] overflow-hidden">
      <div className="flex flex-col justify-center px-5 sm:px-6 md:px-10 lg:px-20 py-12 sm:py-14 lg:py-0 order-1">
        <div
          className="inline-flex items-center gap-2 mb-6 self-start px-3 py-1 rounded-full"
          style={{ backgroundColor: "#DCF0EF" }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#3A6B6E" }} />
          <span className="text-[11px] uppercase tracking-[0.18em] font-medium" style={{ color: "#3A6B6E" }}>
            The Quilting Retreat Marketplace
          </span>
        </div>

        <h1 className="font-display text-[clamp(2rem,5.5vw,4rem)] font-bold leading-[1.15] text-foreground mb-5 max-w-xl">
          Find retreats
          <br />
          Teach quilters
          <br />
          Fill your venue
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            to="/retreats"
            className="flex items-center justify-center gap-2 text-white px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-semibold rounded-[6px] transition-colors shadow-md hover:opacity-90 w-full sm:w-auto"
            style={{ background: "#3A6B6E" }}
          >
            Explore Retreats <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <Link
            to="/signup"
            className="flex items-center justify-center gap-2 border-2 px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-semibold rounded-[6px] transition-colors hover:bg-secondary w-full sm:w-auto"
            style={{ borderColor: "#B85C38", color: "#B85C38" }}
          >
            Sign Up <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="lg:hidden relative aspect-[16/10] sm:aspect-[16/9] mx-5 sm:mx-6 mb-8 sm:mb-10 bg-secondary overflow-hidden order-2 rounded-[8px]">
        <img
          src={heroMain}
          alt="Quilters working together at a cozy retreat"
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div
        className="hidden lg:grid grid-cols-2 bg-secondary order-2"
        style={{ gridTemplateRows: "55% 45%" }}
      >
        <div className="row-span-2 relative overflow-hidden border-l border-border/40">
          <img
            src={heroMain}
            alt="Quilters working together at a cozy retreat"
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
          />
        </div>
        <div className="relative overflow-hidden border-l border-b border-border/40">
          <img
            src={heroAccent1}
            alt="Cozy craft supplies on a floral tablecloth"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="relative overflow-hidden border-l border-border/40">
          <img
            src={heroAccent2}
            alt="Person quilting at a retreat studio"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
