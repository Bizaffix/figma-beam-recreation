import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";
import { FaqSection } from "@/components/quilt-match-home/homepage/faq-section";
import { QM_RUST, QM_TEAL } from "@/lib/quilt-match-home-brand";

export default function QuiltMatchFaqPage() {
  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground selection:bg-rust/20 overflow-x-hidden flex flex-col">
      <QuiltMatchSiteHeader />

      <main className="flex-1">
        <section className="py-20 px-5 bg-card border-b border-border">
          <div className="max-w-4xl mx-auto text-center">
            <p
              className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3"
              style={{ color: QM_RUST }}
            >
              Help &amp; Support
            </p>
            <h1 className="font-display text-4xl md:text-[2.6rem] font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about QuiltMatch — from booking your first retreat to listing your venue.
            </p>
          </div>
        </section>

        <FaqSection />

        <section className="py-16 px-5 border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Still have questions?
            </h2>
            <p className="text-muted-foreground text-base mb-8">
              Our team is happy to help — reach out and we&apos;ll get back within a day.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 text-white px-8 py-3.5 text-sm font-semibold rounded-[6px] transition-opacity shadow-sm hover:opacity-90"
              style={{ background: QM_TEAL }}
            >
              Contact us <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <QuiltMatchSiteFooter />
    </div>
  );
}
