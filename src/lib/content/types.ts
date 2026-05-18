export type ContentStatus = "draft" | "published" | "archived";

export type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  category: string;
  tags: string[];
  published_at: string | null;
};

export type BlogPostFull = BlogPostSummary & {
  body_markdown: string;
  seo_title: string | null;
  seo_description: string | null;
};

export type NewsItemSummary = {
  slug: string;
  headline: string;
  summary_markdown: string;
  image_url: string | null;
  tags: string[];
  related_retreat_slug: string | null;
  published_at: string | null;
};

export type NewsItemFull = NewsItemSummary & {
  body_markdown: string;
};

export type AdminBlogRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string;
  published_at: string | null;
  created_at: string;
};

export type AdminNewsRow = {
  id: string;
  slug: string;
  headline: string;
  status: string;
  published_at: string | null;
  created_at: string;
};
