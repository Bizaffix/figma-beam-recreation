import { runApiEndpoint } from "@/redux/apiDispatch";
import { adminApi } from "@/services/server";

export async function triggerGenerateBlog(): Promise<{ slug: string }> {
  const data = await runApiEndpoint<{ slug: string }>(adminApi.endpoints.generateBlog);
  if (!data?.slug) throw new Error("Blog generation failed");
  return { slug: data.slug };
}

export async function triggerGenerateNews(): Promise<{ slugs: string[] }> {
  const data = await runApiEndpoint<{ slugs: string[] }>(adminApi.endpoints.generateNews);
  return { slugs: data.slugs ?? [] };
}
