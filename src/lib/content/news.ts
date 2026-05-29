import { runApiEndpoint } from "@/redux/apiDispatch";

import { contentApi } from "@/services/server";

import type { NewsItemFull, NewsItemSummary } from "@/lib/content/types";



type BackendNewsSummary = {

  slug: string;

  headline: string;

  summaryMarkdown: string;

  imageUrl?: string | null;

  tags?: string[];

  relatedRetreatSlug?: string | null;

  publishedAt?: string | null;

};



type BackendNewsItem = BackendNewsSummary & {

  bodyMarkdown: string;

};



const mapNewsSummary = (item: BackendNewsSummary): NewsItemSummary => ({

  slug: item.slug,

  headline: item.headline,

  summary_markdown: item.summaryMarkdown,

  image_url: item.imageUrl ?? null,

  tags: item.tags ?? [],

  related_retreat_slug: item.relatedRetreatSlug ?? null,

  published_at: item.publishedAt ?? null,

});



const mapNewsFull = (item: BackendNewsItem): NewsItemFull => ({

  ...mapNewsSummary(item),

  body_markdown: item.bodyMarkdown,

});



function isNotFound(error: unknown): boolean {

  return Boolean(

    error &&

      typeof error === "object" &&

      "status" in error &&

      (error as { status: number }).status === 404,

  );

}



export async function fetchPublishedNewsItems(limit = 80): Promise<NewsItemSummary[]> {

  const items = await runApiEndpoint<BackendNewsSummary[]>(contentApi.endpoints.getNewsItems, {

    limit,

    sort: "publishedAt:desc",

  });

  return items.map((item) => mapNewsSummary(item as BackendNewsSummary));

}



export async function fetchNewsItemBySlug(slug: string): Promise<NewsItemFull | null> {

  try {

    const item = await runApiEndpoint<BackendNewsItem>(contentApi.endpoints.getNewsItemBySlug, slug);

    return mapNewsFull(item as BackendNewsItem);

  } catch (error) {

    if (isNotFound(error)) return null;

    throw error;

  }

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


