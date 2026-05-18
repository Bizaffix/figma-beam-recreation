import { Link } from "react-router-dom";
import { Search, Heart, CheckCircle, ArrowRight } from "lucide-react";
import { QM_TEAL, QM_RUST, QM_AMBER } from "@/lib/quilt-match-home-brand";

const STEPS = [
  {
    step: "1",
    title: "Browse & Discover",
    desc: "Search retreats by location, skill level, dates, and style. Filter to find exactly what you're looking for.",
    icon: Search,
    color: QM_TEAL,
  },
  {
    step: "2",
    title: "Connect with Hosts",
    desc: "View detailed retreat info, read reviews, and message hosts directly with questions before booking.",
    icon: Heart,
    color: QM_RUST,
  },
  {
    step: "3",
    title: "Book Your Spot",
    desc: "Secure your reservation with our safe payment system. Get instant confirmation and retreat details.",
    icon: CheckCircle,
    color: QM_AMBER,
  },
] as const;

export function BookingStepsSection() {
  return (
    <section className="py-20 px-5 bg-card border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl md:text-[2.6rem] font-bold text-foreground mb-3">How Booking Works</h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
            Three simple steps to your next quilting adventure
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {STEPS.map((item) => (
            <div key={item.step} className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 shadow-md"
                style={{ background: item.color }}
              >
                <item.icon size={28} color="white" strokeWidth={2} aria-hidden />
              </div>
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4"
                style={{ background: `${item.color}20`, color: item.color }}
              >
                Step {item.step}
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/retreats"
            className="inline-flex items-center justify-center gap-2 text-white px-8 py-4 text-sm font-semibold rounded-[6px] transition-opacity shadow-md hover:opacity-90"
            style={{ background: QM_TEAL }}
          >
            Start Browsing Retreats <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
