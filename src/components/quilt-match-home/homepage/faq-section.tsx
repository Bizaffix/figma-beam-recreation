import { ChevronRight } from "lucide-react";
import { QM_TEAL } from "@/lib/quilt-match-home-brand";

const FAQS = [
  {
    q: "How do I book a quilting retreat?",
    a: "Simply browse our retreats, select one that interests you, and click 'View Details' to see full information. You can message the host with questions or book directly through our secure payment system.",
  },
  {
    q: "What's your cancellation policy?",
    a: "Cancellation policies vary by retreat and are set by individual hosts. You'll see the specific cancellation policy on each retreat listing before booking. Most hosts offer flexible cancellation up to 30 days before the event.",
  },
  {
    q: "Do I need quilting experience to attend?",
    a: "Not at all! We have retreats for every skill level - from absolute beginners to advanced quilters. Each listing clearly shows the skill level required, so you can find the perfect match for your experience.",
  },
  {
    q: "How do I become a retreat creator or host?",
    a: "Click 'Create Retreats' in the navigation to set up your creator profile. For venue hosts, click 'List Your Space'. Both are free to get started, and we'll guide you through the setup process.",
  },
  {
    q: "What fees does QuiltMatch charge?",
    a: "For quilters attending retreats, there are no fees - you only pay the retreat price. Creators and venue hosts pay a small service fee only when they receive a booking. There are no upfront costs or monthly subscriptions.",
  },
  {
    q: "Are accommodations included in retreat pricing?",
    a: "It depends on the retreat. Some include accommodation and meals in the price, while others are workshop-only. Check each retreat's details page for specific inclusions.",
  },
];

export function FaqSection() {
  return (
    <section className="py-20 px-5 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl md:text-[2.6rem] font-bold text-foreground mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-base">Everything you need to know about QuiltMatch</p>
        </div>

        <div className="space-y-6">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group border border-border bg-card rounded-[8px] p-6 hover:shadow-md transition-all"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h3 className="font-display text-lg font-bold text-foreground pr-4">{faq.q}</h3>
                <ChevronRight
                  size={20}
                  className="shrink-0 transition-transform group-open:rotate-90"
                  style={{ color: QM_TEAL }}
                  aria-hidden
                />
              </summary>
              <p className="text-sm text-muted-foreground leading-relaxed mt-4">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
