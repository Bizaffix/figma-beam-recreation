import { supabase } from "@/lib/supabase";
import type { NewsItemFull, NewsItemSummary } from "@/lib/content/types";

export async function fetchPublishedNewsItems(limit = 80): Promise<NewsItemSummary[]> {
  const { data, error } = await supabase
    .from("news_items")
    .select("slug,headline,summary_markdown,image_url,tags,related_retreat_slug,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "42P01" || error.message.includes("does not exist")) {
      return [];
    }
    throw error;
  }
  return (data ?? []) as NewsItemSummary[];
}

export async function fetchNewsItemBySlug(slug: string): Promise<NewsItemFull | null> {
  const { data, error } = await supabase
    .from("news_items")
    .select("slug,headline,summary_markdown,body_markdown,image_url,tags,related_retreat_slug,published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.message.includes("does not exist")) {
      return null;
    }
    throw error;
  }
  return data as NewsItemFull | null;
}

export function newsTimeBucket(date: string | null): "Today" | "This week" | "Earlier" {
  if (!date) return "Earlier";
  const d = new Date(date).getTime();
  const now = Date.now();
  const day = 86400000;
  if (now - d < day) return "Today";
  if (now - d < 7 * day) return "This week";
  return "Earlier";
}
