import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope, QueryParams } from "@/types/api.types";
import { toParams } from "@/services/server/utils";
import type { BlogPostFull, BlogPostSummary, NewsItemFull, NewsItemSummary } from "@/lib/content/types";

type BackendBlogSummary = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl?: string | null;
  category: string;
  tags?: string[];
  publishedAt?: string | null;
};

type BackendBlogPost = BackendBlogSummary & {
  bodyMarkdown: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

const mapBlogSummary = (item: BackendBlogSummary): BlogPostSummary => ({
  slug: item.slug,
  title: item.title,
  excerpt: item.excerpt,
  cover_image_url: item.coverImageUrl ?? null,
  category: item.category,
  tags: item.tags ?? [],
  published_at: item.publishedAt ?? null,
});

const mapBlogFull = (item: BackendBlogPost): BlogPostFull => ({
  ...mapBlogSummary(item),
  body_markdown: item.bodyMarkdown,
  seo_title: item.seoTitle ?? null,
  seo_description: item.seoDescription ?? null,
});

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

export const contentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBlogPosts: builder.query<BlogPostSummary[], QueryParams | void>({
      query: (params) => ({
        url: "/blog",
        params: toParams({ limit: 60, sort: "publishedAt:desc", ...params }),
      }),
      transformResponse: (response: ApiEnvelope<{ items: BackendBlogSummary[] }>) =>
        (response.data.items ?? []).map(mapBlogSummary),
      providesTags: ["Content"],
    }),

    getBlogPostBySlug: builder.query<BlogPostFull, string>({
      query: (slug) => `/blog/${encodeURIComponent(slug)}`,
      transformResponse: (response: ApiEnvelope<{ post: BackendBlogPost }>) => mapBlogFull(response.data.post),
      providesTags: ["Content"],
    }),

    getNewsItems: builder.query<NewsItemSummary[], QueryParams | void>({
      query: (params) => ({
        url: "/news",
        params: toParams({ limit: 60, sort: "publishedAt:desc", ...params }),
      }),
      transformResponse: (response: ApiEnvelope<{ items: BackendNewsSummary[] }>) =>
        (response.data.items ?? []).map(mapNewsSummary),
      providesTags: ["Content"],
    }),

    getNewsItemBySlug: builder.query<NewsItemFull, string>({
      query: (slug) => `/news/${encodeURIComponent(slug)}`,
      transformResponse: (response: ApiEnvelope<{ item: BackendNewsItem }>) =>
        mapNewsFull(response.data.item),
    }),

    adminGetBlogPosts: builder.query<Record<string, unknown>[], QueryParams | void>({
      query: (params) => ({
        url: "/admin/content/blog",
        params: toParams(params ?? undefined),
      }),
      transformResponse: (response: ApiEnvelope<{ items: Record<string, unknown>[] }>) =>
        response.data.items ?? [],
      providesTags: ["Content"],
    }),

    adminUpsertBlogPost: builder.mutation<
      Record<string, unknown>,
      { slug?: string; body: Record<string, unknown> }
    >({
      query: ({ slug, body }) => ({
        url: slug ? `/admin/content/blog/${encodeURIComponent(slug)}` : "/admin/content/blog",
        method: slug ? "PATCH" : "POST",
        body,
      }),
      invalidatesTags: ["Content"],
    }),

    adminDeleteBlogPost: builder.mutation<void, string>({
      query: (slug) => ({
        url: `/admin/content/blog/${encodeURIComponent(slug)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Content"],
    }),

    adminGetNewsItems: builder.query<Record<string, unknown>[], QueryParams | void>({
      query: (params) => ({
        url: "/admin/content/news",
        params: toParams(params ?? undefined),
      }),
      transformResponse: (response: ApiEnvelope<{ items: Record<string, unknown>[] }>) =>
        response.data.items ?? [],
      providesTags: ["Content"],
    }),

    adminUpsertNewsItem: builder.mutation<
      Record<string, unknown>,
      { slug?: string; body: Record<string, unknown> }
    >({
      query: ({ slug, body }) => ({
        url: slug ? `/admin/content/news/${encodeURIComponent(slug)}` : "/admin/content/news",
        method: slug ? "PATCH" : "POST",
        body,
      }),
      invalidatesTags: ["Content"],
    }),

    adminDeleteNewsItem: builder.mutation<void, string>({
      query: (slug) => ({
        url: `/admin/content/news/${encodeURIComponent(slug)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Content"],
    }),
  }),
});

export const {
  useGetBlogPostsQuery,
  useLazyGetBlogPostsQuery,
  useGetBlogPostBySlugQuery,
  useLazyGetBlogPostBySlugQuery,
  useGetNewsItemsQuery,
  useLazyGetNewsItemsQuery,
  useGetNewsItemBySlugQuery,
  useLazyGetNewsItemBySlugQuery,
  useAdminGetBlogPostsQuery,
  useAdminUpsertBlogPostMutation,
  useAdminDeleteBlogPostMutation,
  useAdminGetNewsItemsQuery,
  useAdminUpsertNewsItemMutation,
  useAdminDeleteNewsItemMutation,
} = contentApi;
