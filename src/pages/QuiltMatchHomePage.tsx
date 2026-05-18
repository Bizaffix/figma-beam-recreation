import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";
import { QuiltMatchHeroSection } from "@/components/quilt-match-home/hero-section";
import { CommunityQuoteSection } from "@/components/quilt-match-home/homepage/community-quote-section";
import { OpenVenuesSection } from "@/components/quilt-match-home/homepage/open-venues-section";
import { AiSearchSection } from "@/components/quilt-match-home/homepage/ai-search-section";
import { FeaturedRetreatsSection } from "@/components/quilt-match-home/homepage/featured-retreats-section";
import { FeaturedCreatorsSection } from "@/components/quilt-match-home/homepage/featured-creators-section";
import { RegionsSection } from "@/components/quilt-match-home/homepage/regions-section";
import { HowItWorksSection } from "@/components/quilt-match-home/homepage/how-it-works-section";
import { FinalCtaSection } from "@/components/quilt-match-home/homepage/final-cta-section";
import { BookingStepsSection } from "@/components/quilt-match-home/homepage/booking-steps-section";
import { FaqSection } from "@/components/quilt-match-home/homepage/faq-section";
import { allRetreats } from "@/data/quiltMatchHomeRetreats";

const featuredRetreats = allRetreats.slice(0, 4);

const featuredCreators = (() => {
  const seen = new Set<string>();
  const out: typeof allRetreats = [];
  for (const r of allRetreats) {
    if (seen.has(r.creator.name)) continue;
    seen.add(r.creator.name);
    out.push(r);
    if (out.length === 4) break;
  }
  return out;
})();

export function QuiltMatchHomePage() {
  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground selection:bg-rust/20 overflow-x-hidden">
      <QuiltMatchSiteHeader />

      <main>
        <QuiltMatchHeroSection />
        <CommunityQuoteSection />
        <OpenVenuesSection />
        <AiSearchSection />
        <FeaturedRetreatsSection retreats={featuredRetreats} />
        <FeaturedCreatorsSection creators={featuredCreators} />
        <RegionsSection />
        <HowItWorksSection />
        <FinalCtaSection />
        <BookingStepsSection />
        <FaqSection />
      </main>

      <QuiltMatchSiteFooter />
    </div>
  );
}
