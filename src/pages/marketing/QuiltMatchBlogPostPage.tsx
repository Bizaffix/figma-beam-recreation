import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";
import { useGetBlogPostBySlugQuery } from "@/services/server";
import { renderMarkdown } from "@/lib/markdown";

function BlogLoadingOrNotFound({ children }: { children: React.ReactNode }) {
  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground flex flex-col">
      <QuiltMatchSiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-24">{children}</main>
      <QuiltMatchSiteFooter />
    </div>
  );
}

export default function QuiltMatchBlogPostPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useGetBlogPostBySlugQuery(slug, {
    skip: !slug,
  });

  useEffect(() => {
    if (post) {
      document.title = `${post.seo_title ?? post.title} | QuiltMatch`;
    }
  }, [post]);

  if (isLoading) {
    return (
      <BlogLoadingOrNotFound>
        <p className="text-muted-foreground">Loading article…</p>
      </BlogLoadingOrNotFound>
    );
  }

  if (isError || !post) {
    return (
      <BlogLoadingOrNotFound>
        <div className="text-center">
          <h1 className="font-display text-3xl mb-4">Article not found</h1>
          <Link to="/blog" className="text-rust underline">
            Back to the blog
          </Link>
        </div>
      </BlogLoadingOrNotFound>
    );
  }

  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground">
      <QuiltMatchSiteHeader />
      <main>
        <article className="max-w-3xl mx-auto px-6 pt-16 pb-24">
          <Link to="/blog" className="text-[10px] font-mono uppercase tracking-widest text-rust hover:underline">
            ← Back to journal
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-8 block">
            {post.category}
          </span>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight mt-3 mb-5">{post.title}</h1>
          <p className="text-lg text-muted-foreground mb-8">{post.excerpt}</p>
          <div className="flex items-center gap-3 mb-10 text-xs text-muted-foreground">
            <span>QuiltMatch Editorial</span>
            {post.published_at && (
              <>
                <span>·</span>
                <time>
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </>
            )}
          </div>
          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full aspect-[16/9] object-cover mb-10 border border-border"
            />
          )}
          <div
            className="prose-content max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body_markdown) }}
          />
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground italic mb-6">
              AI-assisted, editorially reviewed. Help us improve —{" "}
              <Link to="/" className="underline">
                share feedback
              </Link>
              .
            </p>
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
