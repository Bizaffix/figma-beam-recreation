import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse(
      { error: "Missing Supabase environment variables" },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, { status: 401 });
  }

  // 1) Verify JWT and get user
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser();

  if (userError || !userData?.user) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Authorize admin via profiles.role (server-side)
  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError) {
    return jsonResponse({ error: "Failed to verify role" }, { status: 500 });
  }

  if (profile?.role !== "admin") {
    return jsonResponse({ error: "Forbidden" }, { status: 403 });
  }

  const umamiApiKey = Deno.env.get("UMAMI_API_KEY");
  const umamiWebsiteId = Deno.env.get("UMAMI_WEBSITE_ID");
  const umamiApiBase = Deno.env.get("UMAMI_API_BASE") ?? "https://api.umami.is/v1";

  if (!umamiApiKey || !umamiWebsiteId) {
    return jsonResponse({ error: "Missing Umami secrets" }, { status: 500 });
  }

  const url = new URL(req.url);
  const startAtParam = url.searchParams.get("startAt");
  const endAtParam = url.searchParams.get("endAt");

  const now = Date.now();
  const defaultStartAt = now - 30 * 24 * 60 * 60 * 1000;
  const startAt = startAtParam ? Number(startAtParam) : defaultStartAt;
  const endAt = endAtParam ? Number(endAtParam) : now;

  if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) {
    return jsonResponse({ error: "Invalid startAt/endAt" }, { status: 400 });
  }

  const path = new URL(req.url).pathname;
  const idx = path.lastIndexOf("/analytics");
  const route = idx >= 0 ? path.slice(idx + "/analytics".length) : "";
  const normalizedRoute = route === "" || route === "/" ? "/overview" : route;

  const umamiFetch = async (pathname: string, searchParams: Record<string, string>) => {
    const umamiUrl = new URL(`${umamiApiBase}${pathname}`);
    Object.entries(searchParams).forEach(([k, v]) => umamiUrl.searchParams.set(k, v));

    let umamiRes: Response;
    try {
      umamiRes = await fetch(umamiUrl.toString(), {
        headers: {
          Accept: "application/json",
          "x-umami-api-key": umamiApiKey,
        },
      });
    } catch (error) {
      return {
        ok: false as const,
        status: 502,
        body: {
          error: "Failed to reach Umami API",
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }

    if (!umamiRes.ok) {
      const text = await umamiRes.text().catch(() => "");
      return {
        ok: false as const,
        status: umamiRes.status,
        body: {
          error: "Failed to fetch Umami",
          status: umamiRes.status,
          url: umamiUrl.toString(),
          details: text,
        },
      };
    }

    const json = await umamiRes.json();
    return { ok: true as const, status: 200, body: json };
  };

  if (normalizedRoute === "/overview") {
    const res = await umamiFetch(`/websites/${umamiWebsiteId}/stats`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
    });

    if (!res.ok) return jsonResponse(res.body, { status: res.status });

    const stats = res.body as {
      visitors: number;
      pageviews: number;
      visits: number;
      bounces: number;
    };

    const visits = Number(stats?.visits ?? 0);
    const bounces = Number(stats?.bounces ?? 0);
    const bounceRate = visits > 0 ? (bounces / visits) * 100 : 0;

    return jsonResponse({
      visitors: Number(stats?.visitors ?? 0),
      pageviews: Number(stats?.pageviews ?? 0),
      visits,
      bounceRate: Math.round(bounceRate * 10) / 10,
    });
  }

  if (normalizedRoute === "/timeseries") {
    const unit = new URL(req.url).searchParams.get("unit") ?? "day";
    const timezone = new URL(req.url).searchParams.get("timezone") ?? "UTC";

    const res = await umamiFetch(`/websites/${umamiWebsiteId}/pageviews`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      unit,
      timezone,
    });

    if (!res.ok) return jsonResponse(res.body, { status: res.status });

    const body = res.body as {
      pageviews: Array<{ x: string; y: number }>;
      sessions: Array<{ x: string; y: number }>;
    };

    const pageviewsByX = new Map((body.pageviews ?? []).map((p) => [p.x, p.y]));
    const sessionsByX = new Map((body.sessions ?? []).map((s) => [s.x, s.y]));
    const allKeys = Array.from(new Set([...pageviewsByX.keys(), ...sessionsByX.keys()])).sort();

    return jsonResponse({
      unit,
      timezone,
      points: allKeys.map((x) => ({
        date: x,
        pageviews: Number(pageviewsByX.get(x) ?? 0),
        visitors: Number(sessionsByX.get(x) ?? 0),
      })),
    });
  }

  if (normalizedRoute === "/pages") {
    const limit = new URL(req.url).searchParams.get("limit") ?? "20";

    const res = await umamiFetch(`/websites/${umamiWebsiteId}/metrics/expanded`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      type: "path",
      limit,
      offset: "0",
    });

    if (!res.ok) return jsonResponse(res.body, { status: res.status });

    const rows = (res.body as Array<{
      name: string;
      pageviews: number;
      visitors: number;
      visits: number;
      bounces: number;
      totaltime: number;
    }>) ?? [];

    const totalPageviews = rows.reduce((sum, r) => sum + Number(r.pageviews ?? 0), 0);

    return jsonResponse({
      totalPageviews,
      pages: rows.map((r) => {
        const pv = Number(r.pageviews ?? 0);
        return {
          path: r.name,
          pageviews: pv,
          percent: totalPageviews > 0 ? Math.round((pv / totalPageviews) * 1000) / 10 : 0,
        };
      }),
    });
  }

  if (normalizedRoute === "/events") {
    const unit = new URL(req.url).searchParams.get("unit") ?? "day";
    const timezone = new URL(req.url).searchParams.get("timezone") ?? "UTC";
    const eventsParam = new URL(req.url).searchParams.get("events") ?? "";
    const requested = eventsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await umamiFetch(`/websites/${umamiWebsiteId}/events/series`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      unit,
      timezone,
    });

    if (!res.ok) return jsonResponse(res.body, { status: res.status });

    const series = (res.body as Array<{ x: string; t: string; y: number }>) ?? [];
    const totals: Record<string, number> = {};
    const byEvent: Record<string, Array<{ date: string; count: number }>> = {};

    series.forEach((p) => {
      totals[p.x] = (totals[p.x] ?? 0) + Number(p.y ?? 0);
      (byEvent[p.x] ??= []).push({ date: p.t, count: Number(p.y ?? 0) });
    });

    const selected = requested.length > 0 ? requested : Object.keys(totals);
    selected.forEach((name) => {
      byEvent[name] = (byEvent[name] ?? []).sort((a, b) => a.date.localeCompare(b.date));
    });

    const events = selected
      .map((name) => ({
        name,
        total: totals[name] ?? 0,
        series: byEvent[name] ?? [],
      }))
      .sort((a, b) => b.total - a.total);

    return jsonResponse({ unit, timezone, events });
  }

  return jsonResponse({ error: "Not found" }, { status: 404 });
});
