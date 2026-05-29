import { Link } from "react-router-dom";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";
import { useGetBlogPostsQuery } from "@/services/server";

export default function QuiltMatchBlogPage() {
  const { data: posts = [], isLoading, isError } = useGetBlogPostsQuery();

  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground">
      <QuiltMatchSiteHeader />
      <main>
        <section className="px-6 pt-16 pb-12 max-w-7xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rust mb-4 block">Journal</span>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-4 max-w-3xl">The QuiltMatch blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Planning guides, technique deep-dives, creator stories, and venue inspiration — written for the
            people who make retreats happen.
          </p>
        </section>

        <section className="px-6 pb-24 max-w-7xl mx-auto">
          {isLoading && <p className="text-muted-foreground">Loading articles…</p>}
          {isError && (
            <p className="text-muted-foreground">
              Could not load articles. Check that the backend API is running and reachable.
            </p>
          )}
          {!isLoading && !isError && posts.length === 0 && (
            <p className="text-muted-foreground">New articles are on the way. Check back soon.</p>
          )}
          {!isLoading && !isError && posts.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((p) => (
                <Link key={p.slug} to={`/blog/${p.slug}`} className="group block">
                  <div className="aspect-[4/3] bg-muted overflow-hidden mb-4 border border-border">
                    {p.cover_image_url ? (
                      <img
                        src={p.cover_image_url}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
                    )}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-rust">{p.category}</span>
                  <h2 className="font-display text-2xl tracking-tight mt-2 mb-2 group-hover:text-rust transition-colors">
                    {p.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                  {p.published_at && (
                    <time className="block mt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {new Date(p.published_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <QuiltMatchSiteFooter />
    </div>
  );
}
