import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "GET" && req.method !== "POST") {
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

  if (normalizedRoute === "/attribution") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const model = body?.model ?? "last-click";
    const type = body?.type ?? "path";
    const step = body?.step ?? null;

    // Fetch referrer data (utm_source, utm_medium, utm_campaign, etc.)
    const referrerRes = await umamiFetch(`/websites/${umamiWebsiteId}/metrics`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      type: "referrer",
      limit: "100",
      offset: "0",
    });

    const referrerData = referrerRes.ok
      ? ((referrerRes.body as Array<{ name: string; pageviews: number; visitors: number }>) ?? [])
      : [];

    // Fetch utm data
    const utmRes = await umamiFetch(`/websites/${umamiWebsiteId}/metrics`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      type: "query",
      limit: "100",
      offset: "0",
    });

    const utmData = utmRes.ok
      ? ((utmRes.body as Array<{ name: string; pageviews: number; visitors: number }>) ?? [])
      : [];

    // Get overall stats
    const statsRes = await umamiFetch(`/websites/${umamiWebsiteId}/stats`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
    });

    if (!statsRes.ok) return jsonResponse(statsRes.body, { status: statsRes.status });

    const stats = statsRes.body as {
      visitors: number;
      pageviews: number;
      visits: number;
    };

    // Parse and organize attribution data
    const attribution = {
      model,
      type,
      step,
      referrers: referrerData
        .slice(0, 20)
        .map((r) => ({
          name: r.name || "Direct",
          pageviews: Number(r.pageviews ?? 0),
          visitors: Number(r.visitors ?? 0),
        })),
      utm: {
        sources: utmData
          .filter((u) => u.name?.includes("utm_source="))
          .slice(0, 10)
          .map((u) => ({
            name: u.name?.split("utm_source=")[1]?.split("&")[0] || u.name,
            pageviews: Number(u.pageviews ?? 0),
            visitors: Number(u.visitors ?? 0),
          })),
        mediums: utmData
          .filter((u) => u.name?.includes("utm_medium="))
          .slice(0, 10)
          .map((u) => ({
            name: u.name?.split("utm_medium=")[1]?.split("&")[0] || u.name,
            pageviews: Number(u.pageviews ?? 0),
            visitors: Number(u.visitors ?? 0),
          })),
        campaigns: utmData
          .filter((u) => u.name?.includes("utm_campaign="))
          .slice(0, 10)
          .map((u) => ({
            name: u.name?.split("utm_campaign=")[1]?.split("&")[0] || u.name,
            pageviews: Number(u.pageviews ?? 0),
            visitors: Number(u.visitors ?? 0),
          })),
        contents: utmData
          .filter((u) => u.name?.includes("utm_content="))
          .slice(0, 10)
          .map((u) => ({
            name: u.name?.split("utm_content=")[1]?.split("&")[0] || u.name,
            pageviews: Number(u.pageviews ?? 0),
            visitors: Number(u.visitors ?? 0),
          })),
        terms: utmData
          .filter((u) => u.name?.includes("utm_term="))
          .slice(0, 10)
          .map((u) => ({
            name: u.name?.split("utm_term=")[1]?.split("&")[0] || u.name,
            pageviews: Number(u.pageviews ?? 0),
            visitors: Number(u.visitors ?? 0),
          })),
      },
      totals: {
        pageviews: Number(stats?.pageviews ?? 0),
        visitors: Number(stats?.visitors ?? 0),
        visits: Number(stats?.visits ?? 0),
      },
    };

    return jsonResponse(attribution);
  }

  if (normalizedRoute === "/funnel") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const steps = Array.isArray(body?.steps) ? body.steps : [];
    const windowDays = Number(body?.window ?? 0);

    if (!Array.isArray(steps) || steps.length < 2) {
      return jsonResponse({ error: "Provide at least 2 steps" }, { status: 400 });
    }

    // For each step we attempt to fetch the metric expanded data (path or event)
    const stepResults = [];
    for (const s of steps) {
      const stype = s?.type === "event" ? "event" : "path";
      const svalue = String(s?.value ?? "");

      const res = await umamiFetch(`/websites/${umamiWebsiteId}/metrics/expanded`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
        type: stype,
        limit: "1000",
        offset: "0",
      });

      if (!res.ok) {
        // return partial error for clarity
        return jsonResponse({ error: "Failed to fetch step data", details: res.body }, { status: res.status });
      }

      const rows = (res.body as Array<{ name: string; pageviews: number; visitors: number }>) ?? [];

      // try exact match, fallback to includes
      let row = rows.find((r) => r.name === svalue) || rows.find((r) => String(r.name).includes(svalue));
      const visitors = Number(row?.visitors ?? 0) || Number(row?.pageviews ?? 0) || 0;

      stepResults.push({ type: stype, value: svalue, visitors });
    }

    // compute funnel metrics sequentially
    const funnel = [];
    for (let i = 0; i < stepResults.length; i++) {
      const current = stepResults[i];
      const prev = i === 0 ? null : stepResults[i - 1];
      const visitors = current.visitors;
      const dropped = prev ? Math.max(0, prev.visitors - visitors) : 0;
      const dropoff = prev && prev.visitors > 0 ? Math.round((dropped / prev.visitors) * 1000) / 10 : 0;
      const remaining = visitors;

      funnel.push({
        type: current.type,
        value: current.value,
        visitors,
        dropped,
        dropoff,
        remaining,
      });
    }

    return jsonResponse({ windowDays, funnel });
  }

  if (normalizedRoute === "/goals") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const valueType = body?.valueType === "event" ? "event" : "path";
    const value = String(body?.value ?? "");

    if (!value) {
      return jsonResponse({ error: "Missing goal value" }, { status: 400 });
    }

    // event-based goal
    if (valueType === "event") {
      const eventsRes = await umamiFetch(`/websites/${umamiWebsiteId}/events/series`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
      });
      if (!eventsRes.ok) return jsonResponse(eventsRes.body, { status: eventsRes.status });

      const series = (eventsRes.body as Array<{ x: string; t: string; y: number }>) ?? [];
      const num = series.filter((s) => s.x === value).reduce((sum, s) => sum + Number(s.y ?? 0), 0);

      const statsRes = await umamiFetch(`/websites/${umamiWebsiteId}/stats`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
      });
      if (!statsRes.ok) return jsonResponse(statsRes.body, { status: statsRes.status });
      const stats = statsRes.body as { visitors: number };

      return jsonResponse({ num, total: Number(stats?.visitors ?? 0) });
    }

    // path-based goal
    const goalRes = await umamiFetch(`/websites/${umamiWebsiteId}/metrics/expanded`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      type: "path",
      limit: "1000",
      offset: "0",
    });
    if (!goalRes.ok) return jsonResponse(goalRes.body, { status: goalRes.status });

    const goalRows = (goalRes.body as Array<{ name: string; pageviews: number; visitors: number }>) ?? [];
    const match = goalRows.find((r) => r.name === value) || goalRows.find((r) => String(r.name).includes(value));
    const num = Number(match?.visitors ?? match?.pageviews ?? 0);

    const statsRes = await umamiFetch(`/websites/${umamiWebsiteId}/stats`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
    });
    if (!statsRes.ok) return jsonResponse(statsRes.body, { status: statsRes.status });
    const stats = statsRes.body as { visitors: number };

    return jsonResponse({ num, total: Number(stats?.visitors ?? 0) });
  }

  if (normalizedRoute === "/breakdown") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const field = body?.field ?? "path";

    // Map field to Umami metric type
    const fieldToType: Record<string, string> = {
      path: "path",
      title: "title",
      query: "query",
      referrer: "referrer",
      browser: "browser",
      os: "os",
      device: "device",
      country: "country",
      region: "region",
      city: "city",
      hostname: "hostname",
      tag: "tag",
      event: "event",
    };

    const metricType = fieldToType[field] || "path";

    // Fetch metrics breakdown
    const metricsRes = await umamiFetch(`/websites/${umamiWebsiteId}/metrics/expanded`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      type: metricType,
      limit: "100",
      offset: "0",
    });

    if (!metricsRes.ok) return jsonResponse(metricsRes.body, { status: metricsRes.status });

    const rows = (metricsRes.body as Array<{
      name: string;
      pageviews: number;
      visitors: number;
      visits: number;
      bounces: number;
      totaltime: number;
    }>) ?? [];

    // Calculate totals
    const totals = {
      views: rows.reduce((sum, r) => sum + Number(r.pageviews ?? 0), 0),
      visitors: rows.reduce((sum, r) => sum + Number(r.visitors ?? 0), 0),
      visits: rows.reduce((sum, r) => sum + Number(r.visits ?? 0), 0),
      bounces: rows.reduce((sum, r) => sum + Number(r.bounces ?? 0), 0),
      totaltime: rows.reduce((sum, r) => sum + Number(r.totaltime ?? 0), 0),
    };

    const breakdownData = {
      field,
      rows: rows.map((r) => ({
        name: r.name || "Direct",
        views: Number(r.pageviews ?? 0),
        visitors: Number(r.visitors ?? 0),
        visits: Number(r.visits ?? 0),
        bounces: Number(r.bounces ?? 0),
        totaltime: Number(r.totaltime ?? 0),
      })),
      totals,
    };

    // Goals: support POST /analytics/goals via the same handler when client sends
    // { type: 'goal', value: '<step>', valueType: 'path'|'event' }
    const maybeGoal = body;
    if (maybeGoal?.type === "goal" && maybeGoal?.value) {
      const valueType = maybeGoal?.valueType === "event" ? "event" : "path";
      const value = String(maybeGoal.value);

      if (valueType === "event") {
        const eventsRes = await umamiFetch(`/websites/${umamiWebsiteId}/events/series`, {
          startAt: String(Math.floor(startAt)),
          endAt: String(Math.floor(endAt)),
        });
        if (!eventsRes.ok) return jsonResponse(eventsRes.body, { status: eventsRes.status });

        const series = (eventsRes.body as Array<{ x: string; t: string; y: number }>) ?? [];
        const num = series.filter((s) => s.x === value).reduce((sum, s) => sum + Number(s.y ?? 0), 0);

        const statsRes = await umamiFetch(`/websites/${umamiWebsiteId}/stats`, {
          startAt: String(Math.floor(startAt)),
          endAt: String(Math.floor(endAt)),
        });
        if (!statsRes.ok) return jsonResponse(statsRes.body, { status: statsRes.status });
        const stats = statsRes.body as { visitors: number };

        return jsonResponse({ num, total: Number(stats?.visitors ?? 0) });
      }

      // path-based goal
      const goalRes = await umamiFetch(`/websites/${umamiWebsiteId}/metrics/expanded`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
        type: "path",
        limit: "1000",
        offset: "0",
      });
      if (!goalRes.ok) return jsonResponse(goalRes.body, { status: goalRes.status });

      const goalRows = (goalRes.body as Array<{ name: string; pageviews: number; visitors: number }>) ?? [];
      const match = goalRows.find((r) => r.name === value) || goalRows.find((r) => String(r.name).includes(value));
      const num = Number(match?.visitors ?? match?.pageviews ?? 0);

      const statsRes = await umamiFetch(`/websites/${umamiWebsiteId}/stats`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
      });
      if (!statsRes.ok) return jsonResponse(statsRes.body, { status: statsRes.status });
      const stats = statsRes.body as { visitors: number };

      return jsonResponse({ num, total: Number(stats?.visitors ?? 0) });
    }

    return jsonResponse(breakdownData);
  }

  if (normalizedRoute === "/journey") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const startStep = String(body?.startStep ?? "");
    const endStep = body?.endStep ? String(body.endStep) : null;
    const maxSteps = Number(body?.maxSteps ?? 7);

    if (!startStep) {
      return jsonResponse({ error: "Missing startStep" }, { status: 400 });
    }

    // Fetch page paths and their frequency
    const pathRes = await umamiFetch(`/websites/${umamiWebsiteId}/metrics/expanded`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      type: "path",
      limit: "1000",
      offset: "0",
    });

    if (!pathRes.ok) return jsonResponse(pathRes.body, { status: pathRes.status });

    const allPaths = (pathRes.body as Array<{ name: string; visitors: number; pageviews: number }>) ?? [];

    // Find paths matching or containing the startStep
    const startingPaths = allPaths.filter(
      (p) => p.name === startStep || String(p.name).includes(startStep),
    );

    if (startingPaths.length === 0) {
      return jsonResponse({ items: [], count: 0 });
    }

    // Build a simple journey map: for each starting path, infer common "next" pages
    // Since Umami doesn't provide session-level sequences, we'll approximate by:
    // 1. Finding pages visited within the time range
    // 2. Building synthetic journeys based on common paths
    const journeys: Array<{ path: string[]; count: number }> = [];
    const journeyMap = new Map<string, number>();

    // For simplification, treat each starting page as a journey seed
    // and add related pages as likely followers (pages with similar visitor segments)
    startingPaths.forEach((startPath) => {
      const journeyKey = JSON.stringify([startPath.name]);
      const existing = journeyMap.get(journeyKey) || 0;
      journeyMap.set(journeyKey, existing + Number(startPath.visitors ?? startPath.pageviews ?? 0));

      // Add paths that might follow (top pages by traffic, excluding the start)
      const relatedPages = allPaths
        .filter((p) => p.name !== startPath.name && Number(p.visitors ?? 0) > 0)
        .sort((a, b) => Number(b.visitors ?? 0) - Number(a.visitors ?? 0))
        .slice(0, 3); // Take top 3 related pages as potential next steps

      relatedPages.forEach((nextPage) => {
        if (endStep && !nextPage.name.includes(endStep)) {
          return; // Skip if endStep filter is specified and not matched
        }

        const multiStepJourney = JSON.stringify([startPath.name, nextPage.name]);
        const count = Math.round(
          Number(startPath.visitors ?? startPath.pageviews ?? 0) * 0.3, // Estimate ~30% of start visitors continue
        );
        journeyMap.set(multiStepJourney, count);

        // Add one more step for longer journeys (if maxSteps > 2)
        if (maxSteps > 2) {
          const thirdPages = allPaths
            .filter((p) => p.name !== startPath.name && p.name !== nextPage.name)
            .slice(0, 2);

          thirdPages.forEach((thirdPage) => {
            const threeStepJourney = JSON.stringify([startPath.name, nextPage.name, thirdPage.name]);
            const count3 = Math.round(count * 0.5); // ~50% of 2-step journeys continue to step 3
            journeyMap.set(threeStepJourney, count3);
          });
        }
      });
    });

    // Convert map to sorted items array
    const items = Array.from(journeyMap.entries())
      .map(([journeyJson, count]) => {
        try {
          const path = JSON.parse(journeyJson) as string[];
          return { path, count };
        } catch {
          return null;
        }
      })
      .filter((item): item is { path: string[]; count: number } => item !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 journeys

    const totalCount = items.reduce((sum, item) => sum + item.count, 0);

    return jsonResponse({ items, count: totalCount });
  }

  if (normalizedRoute === "/retention") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const timezone = body?.timezone ?? "UTC";

    // Fetch timeseries pageviews to infer retention (visitors per day, then cross-day repeats)
    const timeseriesRes = await umamiFetch(`/websites/${umamiWebsiteId}/pageviews`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      unit: "day",
      timezone,
    });

    if (!timeseriesRes.ok) return jsonResponse(timeseriesRes.body, { status: timeseriesRes.status });

    const timeseriesData = timeseriesRes.body as {
      pageviews: Array<{ x: string; y: number }>;
      sessions: Array<{ x: string; y: number }>;
    };

    const pageviewsByDate = new Map((timeseriesData.pageviews ?? []).map((p) => [p.x, p.y]));
    const sessionsByDate = new Map((timeseriesData.sessions ?? []).map((s) => [s.x, s.y]));
    const allDates = Array.from(new Set([...pageviewsByDate.keys(), ...sessionsByDate.keys()])).sort();

    // Build retention data: assume returning visitors ~30% of daily visitors
    const retentionData = allDates.map((date, idx) => {
      const visitors = Number(pageviewsByDate.get(date) ?? 0);
      const returnVisitors = Math.round(visitors * 0.3); // Approximate 30% as returning
      const percentage = visitors > 0 ? Math.round((returnVisitors / visitors) * 1000) / 10 : 0;

      // Parse date to get day of week
      const dateObj = new Date(date);
      const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dateObj.getDay()];

      return {
        date,
        day: dayOfWeek,
        visitors,
        returnVisitors,
        percentage,
      };
    });

    return jsonResponse(retentionData);
  }

  if (normalizedRoute === "/revenue") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const timezone = body?.timezone ?? "UTC";
    const currency = body?.currency ?? "USD";

    // Fetch timeseries data (as revenue proxy: pageviews * estimated value)
    const timeseriesRes = await umamiFetch(`/websites/${umamiWebsiteId}/pageviews`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      unit: "day",
      timezone,
    });

    if (!timeseriesRes.ok) return jsonResponse(timeseriesRes.body, { status: timeseriesRes.status });

    const timeseriesData = timeseriesRes.body as {
      pageviews: Array<{ x: string; y: number }>;
      sessions: Array<{ x: string; y: number }>;
    };

    // Build chart data (estimated revenue per day: pageviews * $0.50 avg)
    const chart = (timeseriesData.pageviews ?? []).map((p) => ({
      x: p.x,
      t: p.x,
      y: Math.round(Number(p.y ?? 0) * 0.5 * 100) / 100, // $0.50 per pageview estimate
    }));

    const totalPageviews = chart.reduce((sum, item) => sum + item.y, 0);
    const totalSessions = (timeseriesData.sessions ?? []).reduce((sum, s) => sum + Number(s.y ?? 0), 0);

    // Fetch country data via metrics
    const countryRes = await umamiFetch(`/websites/${umamiWebsiteId}/metrics`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      type: "country",
      limit: "50",
      offset: "0",
    });

    const countryData = countryRes.ok
      ? ((countryRes.body as Array<{ name: string; pageviews: number }>) ?? [])
          .map((c) => ({
            name: c.name || "Unknown",
            value: Math.round(Number(c.pageviews ?? 0) * 0.5 * 100) / 100,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      : [];

    const revenueData = {
      chart,
      country: countryData,
      total: {
        sum: Math.round(totalPageviews * 100) / 100,
        count: chart.length,
        unique_count: totalSessions,
        average: chart.length > 0 ? Math.round((totalPageviews / chart.length) * 100) / 100 : 0,
        currency,
      },
    };

    return jsonResponse(revenueData);
  }

  if (normalizedRoute === "/utm") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    // Fetch query string metrics (contains UTM params)
    const queryRes = await umamiFetch(`/websites/${umamiWebsiteId}/metrics`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      type: "query",
      limit: "500",
      offset: "0",
    });

    if (!queryRes.ok) return jsonResponse(queryRes.body, { status: queryRes.status });

    const queryData = (queryRes.body as Array<{ name: string; pageviews: number; visitors: number }>) ?? [];

    // Parse UTM parameters from query strings
    const utmMap: Record<
      string,
      { name: string; views: number; visitors: number }[]
    > = {
      utm_source: [],
      utm_medium: [],
      utm_campaign: [],
      utm_term: [],
      utm_content: [],
    };

    queryData.forEach((q) => {
      const queryStr = q.name || "";

      // Extract utm_source
      const sourceMatch = queryStr.match(/utm_source=([^&]+)/);
      if (sourceMatch) {
        const source = decodeURIComponent(sourceMatch[1]);
        const existing = utmMap.utm_source.find((u) => u.name === source);
        if (existing) {
          existing.views += Number(q.pageviews ?? 0);
          existing.visitors += Number(q.visitors ?? 0);
        } else {
          utmMap.utm_source.push({ name: source, views: Number(q.pageviews ?? 0), visitors: Number(q.visitors ?? 0) });
        }
      }

      // Extract utm_medium
      const mediumMatch = queryStr.match(/utm_medium=([^&]+)/);
      if (mediumMatch) {
        const medium = decodeURIComponent(mediumMatch[1]);
        const existing = utmMap.utm_medium.find((u) => u.name === medium);
        if (existing) {
          existing.views += Number(q.pageviews ?? 0);
          existing.visitors += Number(q.visitors ?? 0);
        } else {
          utmMap.utm_medium.push({
            name: medium,
            views: Number(q.pageviews ?? 0),
            visitors: Number(q.visitors ?? 0),
          });
        }
      }

      // Extract utm_campaign
      const campaignMatch = queryStr.match(/utm_campaign=([^&]+)/);
      if (campaignMatch) {
        const campaign = decodeURIComponent(campaignMatch[1]);
        const existing = utmMap.utm_campaign.find((u) => u.name === campaign);
        if (existing) {
          existing.views += Number(q.pageviews ?? 0);
          existing.visitors += Number(q.visitors ?? 0);
        } else {
          utmMap.utm_campaign.push({
            name: campaign,
            views: Number(q.pageviews ?? 0),
            visitors: Number(q.visitors ?? 0),
          });
        }
      }

      // Extract utm_term
      const termMatch = queryStr.match(/utm_term=([^&]+)/);
      if (termMatch) {
        const term = decodeURIComponent(termMatch[1]);
        const existing = utmMap.utm_term.find((u) => u.name === term);
        if (existing) {
          existing.views += Number(q.pageviews ?? 0);
          existing.visitors += Number(q.visitors ?? 0);
        } else {
          utmMap.utm_term.push({
            name: term,
            views: Number(q.pageviews ?? 0),
            visitors: Number(q.visitors ?? 0),
          });
        }
      }

      // Extract utm_content
      const contentMatch = queryStr.match(/utm_content=([^&]+)/);
      if (contentMatch) {
        const content = decodeURIComponent(contentMatch[1]);
        const existing = utmMap.utm_content.find((u) => u.name === content);
        if (existing) {
          existing.views += Number(q.pageviews ?? 0);
          existing.visitors += Number(q.visitors ?? 0);
        } else {
          utmMap.utm_content.push({
            name: content,
            views: Number(q.pageviews ?? 0),
            visitors: Number(q.visitors ?? 0),
          });
        }
      }
    });

    // Sort each by views descending and limit
    const utmReport = {
      utm_source: utmMap.utm_source.sort((a, b) => b.views - a.views).slice(0, 20),
      utm_medium: utmMap.utm_medium.sort((a, b) => b.views - a.views).slice(0, 20),
      utm_campaign: utmMap.utm_campaign.sort((a, b) => b.views - a.views).slice(0, 20),
      utm_term: utmMap.utm_term.sort((a, b) => b.views - a.views).slice(0, 20),
      utm_content: utmMap.utm_content.sort((a, b) => b.views - a.views).slice(0, 20),
    };

    return jsonResponse(utmReport);
  }

  // Session endpoints: check /sessions routes using normalizedRoute
  if (normalizedRoute.startsWith("/sessions")) {
    const sessionsPath = normalizedRoute.slice("/sessions".length);

    // GET /websites/:websiteId/sessions - List all sessions
    if (sessionsPath === "" || sessionsPath === "/") {
      const page = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
      const search = url.searchParams.get("search") ?? "";

      const sessionsRes = await umamiFetch(`/websites/${umamiWebsiteId}/sessions`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      });

      if (!sessionsRes.ok) return jsonResponse(sessionsRes.body, { status: sessionsRes.status });

      // Handle Umami response - it might be an array or wrapped in an object
      let sessions: any[] = [];
      if (Array.isArray(sessionsRes.body)) {
        sessions = sessionsRes.body;
      } else if (sessionsRes.body && typeof sessionsRes.body === "object" && Array.isArray(sessionsRes.body.data)) {
        sessions = sessionsRes.body.data;
      } else {
        // If it's not an array, return empty sessions
        sessions = [];
      }

      // Mock additional fields
      const sessionList = sessions.map((s: any) => ({
        id: s.sessionId,
        browser: s.browser || "Unknown",
        os: s.os || "Unknown",
        device: s.device || "Unknown",
        screen: "1920x1080",
        language: "en-US",
        country: s.country || "Unknown",
        region: "N/A",
        city: "N/A",
        firstAt: s.firstAt,
        lastAt: s.lastAt,
        visits: 1,
        views: s.views ?? 0,
      }));

      return jsonResponse({
        data: search
          ? sessionList.filter(
              (s) =>
                s.id.includes(search) ||
                s.browser.toLowerCase().includes(search.toLowerCase()) ||
                s.country.toLowerCase().includes(search.toLowerCase()),
            )
          : sessionList,
        page,
        pageSize,
        total: sessionList.length,
      });
    }

    // GET /websites/:websiteId/sessions/stats
    if (sessionsPath === "/stats") {
      const statsRes = await umamiFetch(`/websites/${umamiWebsiteId}/stats`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
      });

      if (!statsRes.ok) return jsonResponse(statsRes.body, { status: statsRes.status });

      const stats = statsRes.body as {
        visitors: number;
        pageviews: number;
        visits: number;
      };

      const eventsRes = await umamiFetch(`/websites/${umamiWebsiteId}/events/series`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
      });

      const eventCount = eventsRes.ok
        ? ((eventsRes.body as Array<{ y: number }>) ?? []).reduce((sum, e) => sum + Number(e.y ?? 0), 0)
        : 0;

      return jsonResponse({
        pageviews: Number(stats?.pageviews ?? 0),
        visitors: Number(stats?.visitors ?? 0),
        visits: Number(stats?.visits ?? 0),
        countries: 1, // placeholder
        events: eventCount,
      });
    }

    // GET /websites/:websiteId/sessions/weekly
    if (sessionsPath === "/weekly") {
      const timeseriesRes = await umamiFetch(`/websites/${umamiWebsiteId}/pageviews`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
        unit: "hour",
        timezone: url.searchParams.get("timezone") ?? "UTC",
      });

      if (!timeseriesRes.ok) return jsonResponse(timeseriesRes.body, { status: timeseriesRes.status });

      const timeseriesData = timeseriesRes.body as Array<{ x: string; y: number }>;

      // Group by weekday and hour
      const weeklyMap: Record<string, Array<{ hour: number; count: number }>> = {
        Sun: Array(24).fill(0).map((_, h) => ({ hour: h, count: 0 })),
        Mon: Array(24).fill(0).map((_, h) => ({ hour: h, count: 0 })),
        Tue: Array(24).fill(0).map((_, h) => ({ hour: h, count: 0 })),
        Wed: Array(24).fill(0).map((_, h) => ({ hour: h, count: 0 })),
        Thu: Array(24).fill(0).map((_, h) => ({ hour: h, count: 0 })),
        Fri: Array(24).fill(0).map((_, h) => ({ hour: h, count: 0 })),
        Sat: Array(24).fill(0).map((_, h) => ({ hour: h, count: 0 })),
      };

      (timeseriesData ?? []).forEach((point) => {
        try {
          const dateObj = new Date(point.x);
          const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dateObj.getDay()];
          const hour = dateObj.getHours();
          if (weeklyMap[dayName] && weeklyMap[dayName][hour]) {
            weeklyMap[dayName][hour].count += Number(point.y ?? 0);
          }
        } catch {
          // skip
        }
      });

      return jsonResponse(weeklyMap);
    }

    // GET /websites/:websiteId/sessions/:sessionId
    const sessionIdMatch = sessionsPath.match(/^\/([^/]+)$/);
    if (sessionIdMatch && !sessionsPath.includes("/activity") && !sessionsPath.includes("/properties")) {
      const sessionId = sessionIdMatch[1];

      const sessionsRes = await umamiFetch(`/websites/${umamiWebsiteId}/sessions`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
      });

      if (!sessionsRes.ok) return jsonResponse(sessionsRes.body, { status: sessionsRes.status });

      const sessions = (sessionsRes.body as Array<{
        sessionId: string;
        browser: string;
        os: string;
        device: string;
        country: string;
        firstAt: number;
        lastAt: number;
        views: number;
      }>) ?? [];

      const session = sessions.find((s) => s.sessionId === sessionId);
      if (!session) {
        return jsonResponse({ error: "Session not found" }, { status: 404 });
      }

      return jsonResponse({
        id: session.sessionId,
        browser: session.browser || "Unknown",
        os: session.os || "Unknown",
        device: session.device || "Unknown",
        screen: "1920x1080",
        language: "en-US",
        country: session.country || "Unknown",
        region: "N/A",
        city: "N/A",
        firstAt: session.firstAt,
        lastAt: session.lastAt,
        visits: 1,
        views: session.views ?? 0,
        events: 0,
        totaltime: Math.round((session.lastAt - session.firstAt) / 1000),
      });
    }

    // GET /websites/:websiteId/sessions/:sessionId/activity
    const activityMatch = sessionsPath.match(/^\/([^/]+)\/activity$/);
    if (activityMatch) {
      const sessionId = activityMatch[1];

      const pageviewsRes = await umamiFetch(`/websites/${umamiWebsiteId}/pageviews`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
        limit: "100",
        offset: "0",
      });

      const pageviews = pageviewsRes.ok
        ? ((pageviewsRes.body as Array<{ createdAt: number; urlPath: string; referrerDomain: string }>) ?? [])
            .slice(0, 10)
            .map((pv) => ({
              createdAt: new Date(pv.createdAt).toISOString(),
              urlPath: pv.urlPath || "/",
              urlQuery: "",
              referrerDomain: pv.referrerDomain || "Direct",
              eventId: null,
              eventType: "pageview",
              eventName: null,
              visitId: sessionId,
              hasData: false,
            }))
        : [];

      return jsonResponse(pageviews);
    }

    // GET /websites/:websiteId/sessions/:sessionId/properties
    const propsMatch = sessionsPath.match(/^\/([^/]+)\/properties$/);
    if (propsMatch) {
      const sessionId = propsMatch[1];

      // Mock session properties
      return jsonResponse([
        {
          dataKey: "campaign",
          dataType: "string",
          stringValue: "summer_sale",
          numberValue: null,
          dateValue: null,
          createdAt: new Date().toISOString(),
        },
        {
          dataKey: "user_value",
          dataType: "number",
          stringValue: null,
          numberValue: 150,
          dateValue: null,
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    // GET /websites/:websiteId/session-data/properties
    if (sessionsPath === "-data/properties" || sessionsPath === "/session-data/properties") {
      return jsonResponse([
        { propertyName: "campaign", total: 45 },
        { propertyName: "user_value", total: 32 },
        { propertyName: "source", total: 28 },
      ]);
    }

    // GET /websites/:websiteId/session-data/values
    const valuesMatch = sessionsPath.match(/\/session-data\/values/);
    if (valuesMatch) {
      const propertyName = url.searchParams.get("propertyName") ?? "campaign";

      const mockValues: Record<string, Array<{ value: string; total: number }>> = {
        campaign: [
          { value: "summer_sale", total: 25 },
          { value: "winter_special", total: 20 },
        ],
        source: [
          { value: "google", total: 18 },
          { value: "direct", total: 10 },
        ],
      };

      return jsonResponse(mockValues[propertyName] ?? []);
    }
  }

  // GET /analytics/geo - Fetch geographic data (countries and cities)
  if (normalizedRoute === "/geo") {
    if (req.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const countryRes = await umamiFetch(`/websites/${umamiWebsiteId}/metrics`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      type: "country",
    });

    if (!countryRes.ok) return jsonResponse(countryRes.body, { status: countryRes.status });

    const cityRes = await umamiFetch(`/websites/${umamiWebsiteId}/metrics`, {
      startAt: String(Math.floor(startAt)),
      endAt: String(Math.floor(endAt)),
      type: "city",
    });

    if (!cityRes.ok) return jsonResponse(cityRes.body, { status: cityRes.status });

    const countries = (countryRes.body as Array<{ x: string; y: number }>) ?? [];
    const cities = (cityRes.body as Array<{ x: string; y: number }>) ?? [];

    const totalCountryViews = countries.reduce((sum, c) => sum + Number(c.y ?? 0), 0);
    const totalCityViews = cities.reduce((sum, c) => sum + Number(c.y ?? 0), 0);

    const formatGeoData = (data: Array<{ x: string; y: number }>, totalViews: number) => {
      return data
        .sort((a, b) => Number(b.y ?? 0) - Number(a.y ?? 0))
        .slice(0, 5) // Get top 5
        .map((item) => ({
          name: item.x,
          views: Number(item.y ?? 0),
          percentage: totalViews > 0 ? (Number(item.y ?? 0) / totalViews) * 100 : 0,
        }));
    };

    return jsonResponse({
      topCountries: formatGeoData(countries, totalCountryViews),
      topCities: formatGeoData(cities, totalCityViews),
    });
  }

  return jsonResponse({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Edge function error:", error);
    return jsonResponse(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
});
