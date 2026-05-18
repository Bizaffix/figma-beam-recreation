import { supabase } from "@/lib/supabase";
import type { BlogPostFull, BlogPostSummary } from "@/lib/content/types";

export async function fetchPublishedBlogPosts(limit = 60): Promise<BlogPostSummary[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug,title,excerpt,cover_image_url,category,tags,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "42P01" || error.message.includes("does not exist")) {
      return [];
    }
    throw error;
  }
  return (data ?? []) as BlogPostSummary[];
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPostFull | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "slug,title,excerpt,body_markdown,cover_image_url,category,tags,seo_title,seo_description,published_at",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.message.includes("does not exist")) {
      return null;
    }
    throw error;
  }
  return data as BlogPostFull | null;
}
