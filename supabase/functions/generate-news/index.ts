import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getAdminSupabase, jsonResponse } from "../_shared/auth.ts";
import { generateNewsBatchNow } from "../_shared/content-ai.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const supabase = await getAdminSupabase(req);
    const result = await generateNewsBatchNow(supabase);
    return jsonResponse({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("generate-news failed", message);
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return jsonResponse({ ok: false, error: message }, status);
  }
});
