import { Link } from "react-router-dom";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";
import { useGetNewsItemsQuery } from "@/services/server";
import { newsTimeBucket } from "@/lib/content/news";
import type { NewsItemSummary } from "@/lib/content/types";

const BUCKET_LABELS = ["Today", "This week", "Earlier"] as const;

export default function QuiltMatchNewsPage() {
  const { data: items = [], isLoading, isError } = useGetNewsItemsQuery();

  const groups: Record<(typeof BUCKET_LABELS)[number], NewsItemSummary[]> = {
    Today: [],
    "This week": [],
    Earlier: [],
  };
  for (const item of items) {
    groups[newsTimeBucket(item.published_at)].push(item);
  }

  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground">
      <QuiltMatchSiteHeader />
      <main>
        <section className="px-6 pt-16 pb-10 max-w-5xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rust mb-4 block">News</span>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-4">
            What&apos;s happening in quilt retreats
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            New gatherings, seasonal trends, and community moments from across the US. Refreshed every morning and
            evening.
          </p>
        </section>

        <section className="px-6 pb-24 max-w-5xl mx-auto space-y-16">
          {isLoading && <p className="text-muted-foreground">Loading news…</p>}
          {isError && (
            <p className="text-muted-foreground">
              Could not load news. Check that the backend API is running and reachable.
            </p>
          )}
          {!isLoading &&
            !isError &&
            BUCKET_LABELS.map((label) =>
              groups[label].length ? (
                <div key={label}>
                  <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-6 pb-3 border-b border-border">
                    {label}
                  </h2>
                  <ul className="space-y-8">
                    {groups[label].map((n) => (
                      <li key={n.slug}>
                        <Link to={`/news/${n.slug}`} className="group block">
                          <h3 className="font-display text-2xl tracking-tight mb-2 group-hover:text-rust transition-colors">
                            {n.headline}
                          </h3>
                          <p className="text-muted-foreground mb-2">{n.summary_markdown}</p>
                          {n.published_at && (
                            <time className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              {new Date(n.published_at).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </time>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          {!isLoading && !isError && items.length === 0 && (
            <p className="text-muted-foreground">No news yet — fresh items arrive twice daily.</p>
          )}
        </section>
      </main>
      <QuiltMatchSiteFooter />
    </div>
  );
}
