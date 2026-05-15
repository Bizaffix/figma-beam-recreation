import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";

export default function QuiltMatchBlogPage() {
  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground">
      <QuiltMatchSiteHeader />
      <main>
        <section className="px-6 pt-16 pb-12 max-w-7xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rust mb-4 block">Journal</span>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-4 max-w-3xl">The QuiltMatch blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Planning guides, technique deep-dives, creator stories, and venue inspiration —
            written for the people who make retreats happen.
          </p>
        </section>

        <section className="px-6 pb-24 max-w-7xl mx-auto">
          <p className="text-muted-foreground">New articles are on the way. Check back soon.</p>
        </section>
      </main>
      <QuiltMatchSiteFooter />
    </div>
  );
}
