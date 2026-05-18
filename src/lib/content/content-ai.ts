/**
 * AI blog/news generation (quilt-match parity).
 * Disabled until LOVABLE_API_KEY is set — see DEPLOY_CONTENT_AI.md.
 *
 * import { supabase } from "@/lib/supabase";
 *
 * export async function triggerGenerateBlog(): Promise<{ slug: string }> {
 *   const { data, error } = await supabase.functions.invoke("generate-blog", { body: {} });
 *   if (error) throw new Error(error.message);
 *   if (!data?.ok) throw new Error(data?.error ?? "Blog generation failed");
 *   return { slug: data.slug as string };
 * }
 *
 * export async function triggerGenerateNews(): Promise<{ slugs: string[] }> {
 *   const { data, error } = await supabase.functions.invoke("generate-news", { body: {} });
 *   if (error) throw new Error(error.message);
 *   if (!data?.ok) throw new Error(data?.error ?? "News generation failed");
 *   return { slugs: (data.slugs as string[]) ?? [] };
 * }
 */

export {};
