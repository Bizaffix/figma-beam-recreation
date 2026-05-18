import { supabase } from "@/lib/supabase";
import type { AdminBlogRow, AdminNewsRow, ContentStatus } from "@/lib/content/types";

export function slugifyTitle(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function ensureUniqueSlug(table: "blog_posts" | "news_items", base: string): Promise<string> {
  let slug = base || "post";
  let n = 0;
  while (n < 50) {
    const candidate = n === 0 ? slug : `${slug}-${n + 1}`;
    const { data } = await supabase.from(table).select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    n++;
  }
  return `${slug}-${Date.now()}`;
}

export type CreateBlogInput = {
  title: string;
  slug?: string;
  excerpt: string;
  body_markdown: string;
  category?: string;
  cover_image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  publish?: boolean;
};

export type CreateNewsInput = {
  headline: string;
  slug?: string;
  summary_markdown: string;
  body_markdown: string;
  publish?: boolean;
};

export async function adminCreateBlogPost(input: CreateBlogInput): Promise<{ id: string; slug: string }> {
  const baseSlug = slugifyTitle(input.slug?.trim() || input.title);
  if (!baseSlug) throw new Error("Enter a title or URL slug.");
  const slug = await ensureUniqueSlug("blog_posts", baseSlug);
  const publish = Boolean(input.publish);

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      slug,
      title: input.title.trim().slice(0, 200),
      excerpt: input.excerpt.trim().slice(0, 500),
      body_markdown: input.body_markdown,
      cover_image_url: input.cover_image_url?.trim() || null,
      category: (input.category?.trim() || "general").slice(0, 64),
      tags: [],
      seo_title: input.seo_title?.trim().slice(0, 70) || null,
      seo_description: input.seo_description?.trim().slice(0, 170) || null,
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
    })
    .select("id,slug")
    .single();

  if (error) throw error;
  return data as { id: string; slug: string };
}

export async function adminCreateNewsItem(input: CreateNewsInput): Promise<{ id: string; slug: string }> {
  const baseSlug = slugifyTitle(input.slug?.trim() || input.headline);
  if (!baseSlug) throw new Error("Enter a headline or URL slug.");
  const slug = await ensureUniqueSlug("news_items", baseSlug);
  const publish = Boolean(input.publish);

  const { data, error } = await supabase
    .from("news_items")
    .insert({
      slug,
      headline: input.headline.trim().slice(0, 200),
      summary_markdown: input.summary_markdown.trim().slice(0, 500),
      body_markdown: input.body_markdown,
      tags: [],
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
    })
    .select("id,slug")
    .single();

  if (error) throw error;
  return data as { id: string; slug: string };
}

export async function adminListContent(): Promise<{ blogs: AdminBlogRow[]; news: AdminNewsRow[] }> {
  const [blogsRes, newsRes] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("id,slug,title,status,category,published_at,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("news_items")
      .select("id,slug,headline,status,published_at,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (blogsRes.error) throw blogsRes.error;
  if (newsRes.error) throw newsRes.error;

  return {
    blogs: (blogsRes.data ?? []) as AdminBlogRow[],
    news: (newsRes.data ?? []) as AdminNewsRow[],
  };
}

export async function adminSetContentStatus(
  kind: "blog" | "news",
  id: string,
  status: ContentStatus,
): Promise<void> {
  const patch: { status: ContentStatus; published_at?: string } = { status };
  if (status === "published") {
    patch.published_at = new Date().toISOString();
  }

  const table = kind === "blog" ? "blog_posts" : "news_items";
  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) throw error;
}

export async function adminDeleteContent(kind: "blog" | "news", id: string): Promise<void> {
  const table = kind === "blog" ? "blog_posts" : "news_items";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}
