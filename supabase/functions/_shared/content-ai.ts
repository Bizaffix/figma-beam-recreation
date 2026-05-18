import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function callAIJson<T>(args: {
  model: string;
  system: string;
  user: string;
}): Promise<T> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY secret on Supabase");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function generateAndUploadCoverImage(
  supabase: SupabaseClient,
  args: { prompt: string; slug: string },
): Promise<string | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: `Editorial magazine-style cover photo: ${args.prompt}. Warm natural light, cozy craft atmosphere, quilts and fabric textures, no text, no watermarks, photographic, 16:9.`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices: Array<{ message: { images?: Array<{ image_url: { url: string } }> } }>;
    };
    const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl) return null;

    const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
    if (!match) return null;
    const mime = match[1];
    const ext = mime.split("/")[1].replace("jpeg", "jpg");
    const bytes = base64ToBytes(match[2]);
    const path = `blog/${args.slug}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("blog-images").upload(path, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (upErr) return null;
    const { data: pub } = supabase.storage.from("blog-images").getPublicUrl(path);
    return pub.publicUrl ?? null;
  } catch {
    return null;
  }
}

export async function ensureUniqueSlug(
  supabase: SupabaseClient,
  table: "blog_posts" | "news_items",
  base: string,
): Promise<string> {
  let slug = base || `post-${Date.now()}`;
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now()}`;
}

const BLOG_SYSTEM = `You are the senior editor for QuiltMatch, a US marketplace for quilt retreats.
Write helpful, warm, specific articles for an audience of US quilters, creators (workshop leaders),
and venue owners. Voice: Airbnb-meets-craft-magazine — concrete, useful, never salesy.
Always return STRICT JSON matching the schema. No markdown around the JSON.
The body_markdown must be 700-1100 words, use ## for section headings, include a short intro,
3-5 sections, and a closing paragraph. Do NOT include the title as an H1 in body_markdown.
seo_title <= 60 chars, seo_description <= 155 chars, excerpt <= 220 chars.
tags: 3-6 lowercase short tags.`;

const NEWS_SYSTEM = `You are the news editor for QuiltMatch. Write 3 short, original news items
about the US quilt retreat community — new retreats announced, seasonal trends, regional spotlights,
or community moments. Each item is timely and specific. Return STRICT JSON. Voice is friendly journalist.
summary_markdown is 1-2 sentences, body_markdown is 120-220 words with 1-2 short paragraphs.
Do not invent specific named people or businesses you cannot verify; keep specifics generic
(e.g. "a retreat in the Blue Ridge Mountains" rather than fake names). tags: 2-4 short tags.`;

type GeneratedBlog = {
  title: string;
  excerpt: string;
  body_markdown: string;
  seo_title: string;
  seo_description: string;
  tags: string[];
};

type GeneratedNewsItem = {
  headline: string;
  summary_markdown: string;
  body_markdown: string;
  tags: string[];
};

export async function generateBlogPostNow(supabase: SupabaseClient): Promise<{ slug: string }> {
  const { data: topic, error: topicErr } = await supabase
    .from("blog_topics")
    .select("id,topic,category,angle")
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .limit(1)
    .maybeSingle();
  if (topicErr) throw new Error(topicErr.message);
  if (!topic) throw new Error("No blog topics available — run blog_ai_topics migration");

  const userPrompt = `Topic: ${topic.topic}
Category: ${topic.category}
Angle: ${topic.angle ?? "evergreen"}

Return JSON with this exact shape:
{
  "title": string,
  "excerpt": string,
  "body_markdown": string,
  "seo_title": string,
  "seo_description": string,
  "tags": string[]
}`;

  let result: GeneratedBlog;
  try {
    result = await callAIJson<GeneratedBlog>({
      model: "google/gemini-2.5-pro",
      system: BLOG_SYSTEM,
      user: userPrompt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("content_generation_log").insert({
      kind: "blog",
      topic: topic.topic,
      status: "error",
      error: msg,
    });
    throw e;
  }

  const slug = await ensureUniqueSlug(supabase, "blog_posts", slugify(result.title));
  const coverUrl = await generateAndUploadCoverImage(supabase, {
    prompt: `${result.title} — ${result.excerpt}`,
    slug,
  });

  const { data: inserted, error: insErr } = await supabase
    .from("blog_posts")
    .insert({
      slug,
      title: result.title.slice(0, 200),
      excerpt: result.excerpt.slice(0, 300),
      body_markdown: result.body_markdown,
      cover_image_url: coverUrl,
      category: topic.category,
      tags: (result.tags ?? []).slice(0, 8),
      seo_title: result.seo_title?.slice(0, 70) ?? null,
      seo_description: result.seo_description?.slice(0, 170) ?? null,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("id,slug")
    .single();
  if (insErr) throw new Error(insErr.message);

  await supabase.from("blog_topics").update({ last_used_at: new Date().toISOString() }).eq("id", topic.id);
  await supabase.from("content_generation_log").insert({
    kind: "blog",
    topic: topic.topic,
    status: "ok",
    result_id: inserted.id,
  });

  return { slug: inserted.slug };
}

export async function generateNewsBatchNow(supabase: SupabaseClient): Promise<{ slugs: string[] }> {
  const { data: recentRetreats } = await supabase
    .from("retreats")
    .select("title,date")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(5);

  const context = (recentRetreats ?? [])
    .map((e: { title: string; date: string | null }) => `- ${e.title} (${e.date?.slice(0, 10) ?? "TBD"})`)
    .join("\n");

  const userPrompt = `Today is ${new Date().toISOString().slice(0, 10)}.
Recent retreats on QuiltMatch (for inspiration, you may reference trends generally):
${context || "(no recent retreats yet)"}

Return JSON:
{
  "items": [
    { "headline": string, "summary_markdown": string, "body_markdown": string, "tags": string[] }
  ]
}
Generate exactly 3 distinct items.`;

  let result: { items: GeneratedNewsItem[] };
  try {
    result = await callAIJson<{ items: GeneratedNewsItem[] }>({
      model: "google/gemini-2.5-flash",
      system: NEWS_SYSTEM,
      user: userPrompt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("content_generation_log").insert({
      kind: "news",
      status: "error",
      error: msg,
    });
    throw e;
  }

  const inserted: string[] = [];
  for (const item of result.items ?? []) {
    const slug = await ensureUniqueSlug(supabase, "news_items", slugify(item.headline));
    const { data: row, error } = await supabase
      .from("news_items")
      .insert({
        slug,
        headline: item.headline.slice(0, 200),
        summary_markdown: item.summary_markdown.slice(0, 400),
        body_markdown: item.body_markdown,
        tags: (item.tags ?? []).slice(0, 6),
        status: "published",
        published_at: new Date().toISOString(),
      })
      .select("id,slug")
      .single();
    if (!error && row) {
      inserted.push(row.slug);
      await supabase.from("content_generation_log").insert({
        kind: "news",
        topic: item.headline,
        status: "ok",
        result_id: row.id,
      });
    }
  }
  return { slugs: inserted };
}
