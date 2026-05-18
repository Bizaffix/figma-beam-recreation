import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-content-cron-secret",
};

export { corsHeaders };

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Service-role client for admins, or cron secret for scheduled jobs. */
export async function getAdminSupabase(req: Request): Promise<SupabaseClient> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase env");

  const cronSecret = Deno.env.get("CONTENT_CRON_SECRET");
  const cronHeader = req.headers.get("x-content-cron-secret");
  if (cronSecret && cronHeader === cronSecret) {
    return createClient(supabaseUrl, serviceKey);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthorized");

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) throw new Error("Unauthorized");

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Forbidden: admin role required");

  return admin;
}
