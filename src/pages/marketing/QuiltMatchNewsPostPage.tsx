import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";
import { fetchNewsItemBySlug } from "@/lib/content/news";
import { renderMarkdown } from "@/lib/markdown";

export default function QuiltMatchNewsPostPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: item, isLoading, isError } = useQuery({
    queryKey: ["news", "item", slug],
    queryFn: () => fetchNewsItemBySlug(slug),
    enabled: Boolean(slug),
  });

  useEffect(() => {
    if (item) {
      document.title = `${item.headline} | QuiltMatch News`;
    }
  }, [item]);

  if (isLoading) {
    return (
      <div className="quilt-match-home min-h-screen bg-background text-foreground flex flex-col">
        <QuiltMatchSiteHeader />
        <main className="flex-1 flex items-center justify-center px-6 py-24">
          <p className="text-muted-foreground">Loading…</p>
        </main>
        <QuiltMatchSiteFooter />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="quilt-match-home min-h-screen bg-background text-foreground flex flex-col">
        <QuiltMatchSiteHeader />
        <main className="flex-1 flex items-center justify-center px-6 py-24">
          <div className="text-center">
            <h1 className="font-display text-3xl mb-4">News not found</h1>
            <Link to="/news" className="text-rust underline">
              Back to the news feed
            </Link>
          </div>
        </main>
        <QuiltMatchSiteFooter />
      </div>
    );
  }

  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground">
      <QuiltMatchSiteHeader />
      <main>
        <article className="max-w-3xl mx-auto px-6 pt-16 pb-24">
          <Link to="/news" className="text-[10px] font-mono uppercase tracking-widest text-rust hover:underline">
            ← Back to news
          </Link>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-6 mb-4">{item.headline}</h1>
          <p className="text-lg text-muted-foreground mb-8">{item.summary_markdown}</p>
          {item.published_at && (
            <time className="block mb-10 text-xs text-muted-foreground">
              {new Date(item.published_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
            </time>
          )}
          <div
            className="prose-content max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(item.body_markdown) }}
          />
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground italic mb-6">AI-assisted, editorially reviewed.</p>
            <Link to="/retreats" className="btn-primary inline-block px-6 py-3">
              Browse upcoming retreats
            </Link>
          </div>
        </article>
      </main>
      <QuiltMatchSiteFooter />
    </div>
  );
}
