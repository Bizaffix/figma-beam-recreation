import { runApiEndpoint } from "@/redux/apiDispatch";

import { contentApi } from "@/services/server";

import type { AdminBlogRow, AdminNewsRow, ContentStatus } from "@/lib/content/types";



type BackendBlogPost = {

  id: string;

  slug: string;

  title: string;

  status: string;

  category: string;

  publishedAt?: string | null;

  createdAt: string;

};



type BackendNewsItem = {

  id: string;

  slug: string;

  headline: string;

  status: string;

  publishedAt?: string | null;

  createdAt: string;

};



const mapAdminBlogRow = (item: BackendBlogPost): AdminBlogRow => ({

  id: item.id,

  slug: item.slug,

  title: item.title,

  status: item.status,

  category: item.category,

  published_at: item.publishedAt ?? null,

  created_at: item.createdAt,

});



const mapAdminNewsRow = (item: BackendNewsItem): AdminNewsRow => ({

  id: item.id,

  slug: item.slug,

  headline: item.headline,

  status: item.status,

  published_at: item.publishedAt ?? null,

  created_at: item.createdAt,

});



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

  const publish = Boolean(input.publish);

  const coverUrl = input.cover_image_url?.trim();



  const post = await runApiEndpoint(contentApi.endpoints.adminUpsertBlogPost, {

    body: {

      title: input.title.trim().slice(0, 200),

      slug: baseSlug,

      excerpt: input.excerpt.trim().slice(0, 500),

      bodyMarkdown: input.body_markdown,

      ...(coverUrl ? { coverImageUrl: coverUrl } : {}),

      category: (input.category?.trim() || "general").slice(0, 64),

      tags: [],

      ...(input.seo_title?.trim() ? { seoTitle: input.seo_title.trim().slice(0, 70) } : {}),

      ...(input.seo_description?.trim()

        ? { seoDescription: input.seo_description.trim().slice(0, 170) }

        : {}),

      status: publish ? "published" : "draft",

    },

  });



  return { id: String((post as BackendBlogPost).id), slug: String((post as BackendBlogPost).slug) };

}



export async function adminCreateNewsItem(input: CreateNewsInput): Promise<{ id: string; slug: string }> {

  const baseSlug = slugifyTitle(input.slug?.trim() || input.headline);

  if (!baseSlug) throw new Error("Enter a headline or URL slug.");

  const publish = Boolean(input.publish);



  const item = await runApiEndpoint(contentApi.endpoints.adminUpsertNewsItem, {

    body: {

      headline: input.headline.trim().slice(0, 200),

      slug: baseSlug,

      summaryMarkdown: input.summary_markdown.trim().slice(0, 500),

      bodyMarkdown: input.body_markdown,

      tags: [],

      status: publish ? "published" : "draft",

    },

  });



  return { id: String((item as BackendNewsItem).id), slug: String((item as BackendNewsItem).slug) };

}



export async function adminListContent(): Promise<{ blogs: AdminBlogRow[]; news: AdminNewsRow[] }> {

  const [blogItems, newsItems] = await Promise.all([

    runApiEndpoint<Record<string, unknown>[]>(contentApi.endpoints.adminGetBlogPosts, { limit: 100, sort: "createdAt:desc" }),

    runApiEndpoint<Record<string, unknown>[]>(contentApi.endpoints.adminGetNewsItems, { limit: 100, sort: "createdAt:desc" }),

  ]);



  return {

    blogs: blogItems.map((item) => mapAdminBlogRow(item as BackendBlogPost)),

    news: newsItems.map((item) => mapAdminNewsRow(item as BackendNewsItem)),

  };

}



export async function adminSetContentStatus(

  kind: "blog" | "news",

  id: string,

  status: ContentStatus,

): Promise<void> {

  const endpoint =

    kind === "blog" ? contentApi.endpoints.adminUpsertBlogPost : contentApi.endpoints.adminUpsertNewsItem;

  await runApiEndpoint(endpoint, { slug: id, body: { status } });

}



export async function adminDeleteContent(kind: "blog" | "news", id: string): Promise<void> {

  const endpoint =

    kind === "blog" ? contentApi.endpoints.adminDeleteBlogPost : contentApi.endpoints.adminDeleteNewsItem;

  await runApiEndpoint(endpoint, id);

}


