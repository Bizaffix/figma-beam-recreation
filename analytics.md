/**
 * Analytics Edge Function
 * 
 * This function acts as a proxy between the frontend and Umami Analytics API.
 * It handles authentication, authorization, and routes requests to the appropriate
 * Umami API endpoints.
 * 
 * Umami API Documentation Reference:
 * - GET /api/websites/:websiteId/stats - Website statistics
 * - GET /api/websites/:websiteId/pageviews - Pageviews over time
 * - GET /api/websites/:websiteId/metrics - Metrics (simple format)
 * - GET /api/websites/:websiteId/metrics/expanded - Metrics (expanded format)
 * - GET /api/websites/:websiteId/events/series - Event series
 * - GET /api/websites/:websiteId/active - Active users (last 5 minutes)
 * - GET /api/realtime/:websiteId - Realtime data (last 30 minutes)
 * - GET /api/websites/:websiteId/sessions - Session list
 * - GET /api/websites/:websiteId/sessions/stats - Session statistics
 * - GET /api/websites/:websiteId/sessions/weekly - Weekly session patterns
 * - GET /api/websites/:websiteId/sessions/:sessionId - Session details
 * - GET /api/websites/:websiteId/sessions/:sessionId/activity - Session activity
 * - GET /api/websites/:websiteId/sessions/:sessionId/properties - Session properties
 * - GET /api/websites/:websiteId/session-data/properties - Session data properties
 * - GET /api/websites/:websiteId/session-data/values - Session data values
 * 
 * All endpoints support filters: path, referrer, title, query, browser, os, device,
 * country, region, city, hostname, tag, segment, cohort
 * 
 * Unit parameter limits:
 * - minute: Up to 60 minutes
 * - hour: Up to 48 hours
 * - day: Up to 12 months
 * - month: No limit
 * - year: No limit
 */

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

  const umamiFetch = async (
    pathname: string,
    searchParams: Record<string, string> = {},
    options: { method?: string; body?: string } = {},
  ) => {
    const umamiUrl = new URL(`${umamiApiBase}${pathname}`);
    Object.entries(searchParams).forEach(([k, v]) => umamiUrl.searchParams.set(k, v));

    const method = options.method || "GET";
    const headers: Record<string, string> = {
      Accept: "application/json",
      "x-umami-api-key": umamiApiKey,
    };

    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    let umamiRes: Response;
    try {
      umamiRes = await fetch(umamiUrl.toString(), {
        method,
        headers,
        body: options.body,
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
    const filters = body?.filters || {};

    // Use Umami Reports API
    const reportRes = await umamiFetch(
      `/reports/attribution`,
      {},
      {
        method: "POST",
        body: JSON.stringify({
          websiteId: umamiWebsiteId,
          type: "attribution",
          filters,
          parameters: {
            startDate: new Date(startAt).toISOString(),
            endDate: new Date(endAt).toISOString(),
            model,
            type,
            step,
          },
        }),
      },
    );

    if (!reportRes.ok) return jsonResponse(reportRes.body, { status: reportRes.status });

    // Umami Reports API returns: { referrer, paidAds, utm_source, utm_medium, utm_campaign, utm_content, utm_term, total }
    const report = reportRes.body as {
      referrer?: Array<{ name: string; value: number }>;
      paidAds?: Array<{ name: string; value: number }>;
      utm_source?: Array<{ name: string; value: number }>;
      utm_medium?: Array<{ name: string; value: number }>;
      utm_campaign?: Array<{ name: string; value: number }>;
      utm_content?: Array<{ name: string; value: number }>;
      utm_term?: Array<{ name: string; value: number }>;
      total?: {
        pageviews: number;
        visitors: number;
        visits: number;
      };
    };

    // Transform to match existing UI expectations
    return jsonResponse({
      model,
      type,
      step,
      referrers: (report.referrer || []).map((r) => ({
        name: r.name || "Direct",
        pageviews: r.value,
        visitors: r.value,
      })),
      utm: {
        sources: (report.utm_source || []).map((u) => ({
          name: u.name,
          pageviews: u.value,
          visitors: u.value,
        })),
        mediums: (report.utm_medium || []).map((u) => ({
          name: u.name,
          pageviews: u.value,
          visitors: u.value,
        })),
        campaigns: (report.utm_campaign || []).map((u) => ({
          name: u.name,
          pageviews: u.value,
          visitors: u.value,
        })),
        contents: (report.utm_content || []).map((u) => ({
          name: u.name,
          pageviews: u.value,
          visitors: u.value,
        })),
        terms: (report.utm_term || []).map((u) => ({
          name: u.name,
          pageviews: u.value,
          visitors: u.value,
        })),
      },
      totals: report.total || {
        pageviews: 0,
        visitors: 0,
        visits: 0,
      },
    });
  }

  if (normalizedRoute === "/funnel") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const steps = Array.isArray(body?.steps) ? body.steps : [];
    const windowDays = Number(body?.window ?? 60); // Default to 60 days if not provided
    const filters = body?.filters || {};

    if (!Array.isArray(steps) || steps.length < 2) {
      return jsonResponse({ error: "Provide at least 2 steps" }, { status: 400 });
    }

    // Validate steps format
    const validSteps = steps.filter((s) => s && (s.type === "path" || s.type === "event") && s.value);
    if (validSteps.length < 2) {
      return jsonResponse({ error: "Invalid steps format. Each step must have type (path|event) and value" }, { status: 400 });
    }

    try {
      // Use Umami Reports API
      // Note: Umami Reports API expects startDate/endDate as ISO strings (per documentation examples)
      const reportRes = await umamiFetch(
        `/reports/funnel`,
        {},
        {
          method: "POST",
          body: JSON.stringify({
            websiteId: umamiWebsiteId,
            type: "funnel",
            filters,
            parameters: {
              startDate: new Date(startAt).toISOString(),
              endDate: new Date(endAt).toISOString(),
              steps: validSteps,
              window: windowDays,
            },
          }),
        },
      );

      if (!reportRes.ok) {
        console.error("Umami funnel API error:", reportRes.body);
        return jsonResponse(
          {
            error: "Failed to fetch funnel data from Umami",
            details: reportRes.body,
          },
          { status: reportRes.status },
        );
      }

      // Umami Reports API returns: Array of { type, value, visitors, previous, dropped, dropoff, remaining }
      const funnel = (reportRes.body as Array<{
        type: string;
        value: string;
        visitors: number;
        previous: number;
        dropped: number;
        dropoff: number | null;
        remaining: number;
      }>) || [];

      // Transform dropoff from decimal to percentage for UI
      const transformedFunnel = funnel.map((step) => ({
        type: step.type,
        value: step.value,
        visitors: step.visitors,
        dropped: step.dropped,
        dropoff: step.dropoff !== null ? Math.round(step.dropoff * 1000) / 10 : 0, // Convert to percentage
        remaining: step.remaining,
      }));

      return jsonResponse({ window: windowDays, funnel: transformedFunnel });
    } catch (error) {
      console.error("Funnel endpoint error:", error);
      return jsonResponse(
        {
          error: "Internal server error while processing funnel request",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }
  }

  if (normalizedRoute === "/goals") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const valueType = body?.valueType === "event" ? "event" : "path";
    const value = String(body?.value ?? "");
    const filters = body?.filters || {};

    if (!value) {
      return jsonResponse({ error: "Missing goal value" }, { status: 400 });
    }

    // Use Umami Reports API
    const reportRes = await umamiFetch(
      `/reports/goals`,
      {},
      {
        method: "POST",
        body: JSON.stringify({
          websiteId: umamiWebsiteId,
          type: "goal",
          filters,
          parameters: {
            startDate: new Date(startAt).toISOString(),
            endDate: new Date(endAt).toISOString(),
            type: valueType,
            value,
          },
        }),
      },
    );

    if (!reportRes.ok) return jsonResponse(reportRes.body, { status: reportRes.status });

    // Umami Reports API returns: { num, total }
    const goal = reportRes.body as { num: number; total: number };

    return jsonResponse({ num: Number(goal?.num ?? 0), total: Number(goal?.total ?? 0) });
  }

  if (normalizedRoute === "/breakdown") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const field = body?.field ?? "path";
    const filters = body?.filters || {};

    // Use Umami Reports API
    const reportRes = await umamiFetch(
      `/reports/breakdown`,
      {},
      {
        method: "POST",
        body: JSON.stringify({
          websiteId: umamiWebsiteId,
          type: "breakdown",
          filters,
          parameters: {
            startDate: new Date(startAt).toISOString(),
            endDate: new Date(endAt).toISOString(),
            fields: [field],
          },
        }),
      },
    );

    if (!reportRes.ok) return jsonResponse(reportRes.body, { status: reportRes.status });

    // Umami Reports API returns: Array of objects with views, visitors, visits, bounces, totaltime, and field values
    const rows = (reportRes.body as Array<{
      views: number;
      visitors: number;
      visits: number;
      bounces: number;
      totaltime: number;
      [key: string]: any; // field values like os, country, etc.
    }>) || [];

    // Calculate totals
    const totals = {
      views: rows.reduce((sum, r) => sum + Number(r.views ?? 0), 0),
      visitors: rows.reduce((sum, r) => sum + Number(r.visitors ?? 0), 0),
      visits: rows.reduce((sum, r) => sum + Number(r.visits ?? 0), 0),
      bounces: rows.reduce((sum, r) => sum + Number(r.bounces ?? 0), 0),
      totaltime: rows.reduce((sum, r) => sum + Number(r.totaltime ?? 0), 0),
    };

    // Transform to match existing UI format
    const breakdownData = {
      field,
      rows: rows.map((r) => ({
        name: String(r[field] || "Unknown"),
        views: Number(r.views ?? 0),
        visitors: Number(r.visitors ?? 0),
        visits: Number(r.visits ?? 0),
        bounces: Number(r.bounces ?? 0),
        totaltime: Number(r.totaltime ?? 0),
      })),
      totals,
    };

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
    const filters = body?.filters || {};

    if (!startStep) {
      return jsonResponse({ error: "Missing startStep" }, { status: 400 });
    }

    // Use Umami Reports API
    const reportRes = await umamiFetch(
      `/reports/journey`,
      {},
      {
        method: "POST",
        body: JSON.stringify({
          websiteId: umamiWebsiteId,
          type: "journey",
          filters,
          parameters: {
            startDate: new Date(startAt).toISOString(),
            endDate: new Date(endAt).toISOString(),
            steps: Math.max(3, Math.min(7, maxSteps)),
            startStep,
            ...(endStep ? { endStep } : {}),
          },
        }),
      },
    );

    if (!reportRes.ok) return jsonResponse(reportRes.body, { status: reportRes.status });

    // Umami Reports API returns: Array of { items: string[], count: number }
    const journeys = (reportRes.body as Array<{
      items: (string | null)[];
      count: number;
    }>) || [];

    // Transform to match existing UI format
    const items = journeys.map((j) => ({
      path: j.items.filter((item): item is string => item !== null),
      count: j.count,
    }));

    const totalCount = items.reduce((sum, item) => sum + item.count, 0);

    return jsonResponse({ items, count: totalCount });
  }

  if (normalizedRoute === "/retention") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const timezone = body?.timezone ?? "UTC";
    const filters = body?.filters || {};

    // Use Umami Reports API
    const reportRes = await umamiFetch(
      `/reports/retention`,
      {},
      {
        method: "POST",
        body: JSON.stringify({
          websiteId: umamiWebsiteId,
          type: "retention",
          filters,
          parameters: {
            startDate: new Date(startAt).toISOString(),
            endDate: new Date(endAt).toISOString(),
            timezone,
          },
        }),
      },
    );

    if (!reportRes.ok) return jsonResponse(reportRes.body, { status: reportRes.status });

    // Umami Reports API returns: Array of { date, day, visitors, returnVisitors, percentage }
    const retention = (reportRes.body as Array<{
      date: string;
      day: number;
      visitors: number;
      returnVisitors: number;
      percentage: number;
    }>) || [];

    // Transform day number to day name for UI compatibility
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const retentionData = retention.map((r) => ({
      date: r.date,
      day: dayNames[r.day] || String(r.day),
      visitors: Number(r.visitors ?? 0),
      returnVisitors: Number(r.returnVisitors ?? 0),
      percentage: Number(r.percentage ?? 0),
    }));

    return jsonResponse(retentionData);
  }

  if (normalizedRoute === "/revenue") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const timezone = body?.timezone ?? "UTC";
    const currency = body?.currency ?? "USD";
    const filters = body?.filters || {};

    // Use Umami Reports API
    const reportRes = await umamiFetch(
      `/reports/revenue`,
      {},
      {
        method: "POST",
        body: JSON.stringify({
          websiteId: umamiWebsiteId,
          type: "revenue",
          filters,
          parameters: {
            startDate: new Date(startAt).toISOString(),
            endDate: new Date(endAt).toISOString(),
            timezone,
            currency,
          },
        }),
      },
    );

    if (!reportRes.ok) return jsonResponse(reportRes.body, { status: reportRes.status });

    // Umami Reports API returns: { chart, country, total }
    const revenue = reportRes.body as {
      chart: Array<{ x: string; t: string; y: number }>;
      country: Array<{ name: string; value: number }>;
      total: {
        sum: number;
        count: number;
        unique_count: number;
        average: number;
      };
    };

    return jsonResponse({
      chart: revenue.chart || [],
      country: revenue.country || [],
      total: {
        ...revenue.total,
        currency,
      },
    });
  }

  if (normalizedRoute === "/utm") {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const filters = body?.filters || {};

    // Use Umami Reports API
    const reportRes = await umamiFetch(
      `/reports/utm`,
      {},
      {
        method: "POST",
        body: JSON.stringify({
          websiteId: umamiWebsiteId,
          type: "utm",
          filters,
          parameters: {
            startDate: new Date(startAt).toISOString(),
            endDate: new Date(endAt).toISOString(),
          },
        }),
      },
    );

    if (!reportRes.ok) return jsonResponse(reportRes.body, { status: reportRes.status });

    // Umami Reports API returns: { utm_source, utm_medium, utm_campaign, utm_term, utm_content }
    // Each is an array of { utm: string, views: number }
    const utm = reportRes.body as {
      utm_source?: Array<{ utm: string; views: number }>;
      utm_medium?: Array<{ utm: string; views: number }>;
      utm_campaign?: Array<{ utm: string; views: number }>;
      utm_term?: Array<{ utm: string; views: number }>;
      utm_content?: Array<{ utm: string; views: number }>;
    };

    // Transform to match existing UI format
    return jsonResponse({
      utm_source: (utm.utm_source || []).map((u) => ({
        name: u.utm,
        views: u.views,
        visitors: u.views, // Use views as proxy for visitors
      })),
      utm_medium: (utm.utm_medium || []).map((u) => ({
        name: u.utm,
        views: u.views,
        visitors: u.views,
      })),
      utm_campaign: (utm.utm_campaign || []).map((u) => ({
        name: u.utm,
        views: u.views,
        visitors: u.views,
      })),
      utm_term: (utm.utm_term || []).map((u) => ({
        name: u.utm,
        views: u.views,
        visitors: u.views,
      })),
      utm_content: (utm.utm_content || []).map((u) => ({
        name: u.utm,
        views: u.views,
        visitors: u.views,
      })),
    });
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
        page: String(page),
        pageSize: String(pageSize),
        ...(search ? { search } : {}),
      });

      if (!sessionsRes.ok) return jsonResponse(sessionsRes.body, { status: sessionsRes.status });

      // Handle Umami response - should be { data: [], count, page, pageSize }
      const sessionsData = sessionsRes.body as {
        data?: Array<{
          id: string;
          browser: string;
          os: string;
          device: string;
          screen: string;
          language: string;
          country: string;
          region: string;
          city: string;
          firstAt: string;
          lastAt: string;
          visits: number;
          views: number;
        }>;
        count?: number;
        page?: number;
        pageSize?: number;
      };

      const sessions = sessionsData?.data || [];
      const count = sessionsData?.count || sessions.length;

      // Return sessions as-is from Umami (already in correct format)
      return jsonResponse({
        data: sessions,
        count,
        page: sessionsData?.page || page,
        pageSize: sessionsData?.pageSize || pageSize,
      });
    }

    // GET /websites/:websiteId/sessions/stats
    if (sessionsPath === "/stats") {
      const statsRes = await umamiFetch(`/websites/${umamiWebsiteId}/sessions/stats`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
      });

      if (!statsRes.ok) return jsonResponse(statsRes.body, { status: statsRes.status });

      // Umami returns: { pageviews: {value}, visitors: {value}, visits: {value}, countries: {value}, events: {value} }
      const stats = statsRes.body as {
        pageviews?: { value: number };
        visitors?: { value: number };
        visits?: { value: number };
        countries?: { value: number };
        events?: { value: number };
      };

      return jsonResponse({
        pageviews: { value: Number(stats?.pageviews?.value ?? 0) },
        visitors: { value: Number(stats?.visitors?.value ?? 0) },
        visits: { value: Number(stats?.visits?.value ?? 0) },
        countries: { value: Number(stats?.countries?.value ?? 0) },
        events: { value: Number(stats?.events?.value ?? 0) },
      });
    }

    // GET /websites/:websiteId/sessions/weekly
    if (sessionsPath === "/weekly") {
      const weeklyRes = await umamiFetch(`/websites/${umamiWebsiteId}/sessions/weekly`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
        timezone: url.searchParams.get("timezone") ?? "UTC",
      });

      if (!weeklyRes.ok) return jsonResponse(weeklyRes.body, { status: weeklyRes.status });

      // Umami returns: Array of 7 arrays (Sun-Sat), each with 24 numbers (hours 0-23)
      const weeklyData = weeklyRes.body as number[][];

      return jsonResponse(weeklyData || []);
    }

    // GET /websites/:websiteId/sessions/:sessionId
    const sessionIdMatch = sessionsPath.match(/^\/([^/]+)$/);
    if (sessionIdMatch && !sessionsPath.includes("/activity") && !sessionsPath.includes("/properties")) {
      const sessionId = sessionIdMatch[1];

      const sessionRes = await umamiFetch(`/websites/${umamiWebsiteId}/sessions/${sessionId}`, {});

      if (!sessionRes.ok) return jsonResponse(sessionRes.body, { status: sessionRes.status });

      // Umami returns session directly
      const session = sessionRes.body as {
        id: string;
        browser: string;
        os: string;
        device: string;
        screen: string;
        language: string;
        country: string;
        region: string;
        city: string;
        firstAt: string;
        lastAt: string;
        visits: number;
        views: number;
        events: number;
        totaltime: number;
      };

      return jsonResponse(session);
    }

    // GET /websites/:websiteId/sessions/:sessionId/activity
    const activityMatch = sessionsPath.match(/^\/([^/]+)\/activity$/);
    if (activityMatch) {
      const sessionId = activityMatch[1];

      const activityRes = await umamiFetch(`/websites/${umamiWebsiteId}/sessions/${sessionId}/activity`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
      });

      if (!activityRes.ok) return jsonResponse(activityRes.body, { status: activityRes.status });

      // Umami returns activity array directly
      const activity = activityRes.body as Array<{
        createdAt: string;
        urlPath: string;
        urlQuery: string;
        referrerDomain: string;
        eventId: string;
        eventType: number;
        eventName: string;
        visitId: string;
        hasData: number;
      }>;

      return jsonResponse(activity || []);
    }

    // GET /websites/:websiteId/sessions/:sessionId/properties
    const propsMatch = sessionsPath.match(/^\/([^/]+)\/properties$/);
    if (propsMatch) {
      const sessionId = propsMatch[1];

      const propsRes = await umamiFetch(`/websites/${umamiWebsiteId}/sessions/${sessionId}/properties`, {});

      if (!propsRes.ok) return jsonResponse(propsRes.body, { status: propsRes.status });

      // Umami returns properties array directly
      const properties = propsRes.body as Array<{
        websiteId: string;
        sessionId: string;
        dataKey: string;
        dataType: number;
        stringValue: string | null;
        numberValue: number | null;
        dateValue: string | null;
        createdAt: string;
      }>;

      return jsonResponse(properties || []);
    }

    // GET /websites/:websiteId/session-data/properties
    if (sessionsPath === "-data/properties" || sessionsPath === "/session-data/properties") {
      const propsRes = await umamiFetch(`/websites/${umamiWebsiteId}/session-data/properties`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
      });

      if (!propsRes.ok) return jsonResponse(propsRes.body, { status: propsRes.status });

      // Umami returns: [{ propertyName, total }]
      const properties = propsRes.body as Array<{
        propertyName: string;
        total: number;
      }>;

      return jsonResponse(properties || []);
    }

    // GET /websites/:websiteId/session-data/values
    const valuesMatch = sessionsPath.match(/\/session-data\/values/);
    if (valuesMatch) {
      const propertyName = url.searchParams.get("propertyName") ?? "";

      if (!propertyName) {
        return jsonResponse({ error: "Missing propertyName parameter" }, { status: 400 });
      }

      const valuesRes = await umamiFetch(`/websites/${umamiWebsiteId}/session-data/values`, {
        startAt: String(Math.floor(startAt)),
        endAt: String(Math.floor(endAt)),
        propertyName,
      });

      if (!valuesRes.ok) return jsonResponse(valuesRes.body, { status: valuesRes.status });

      // Umami returns: [{ value, total }]
      const values = valuesRes.body as Array<{
        value: string;
        total: number;
      }>;

      return jsonResponse(values || []);
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

  // GET /analytics/active - Get active users (last 5 minutes)
  if (normalizedRoute === "/active") {
    if (req.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const res = await umamiFetch(`/websites/${umamiWebsiteId}/active`, {});

    if (!res.ok) return jsonResponse(res.body, { status: res.status });

    const active = res.body as { visitors: number };

    return jsonResponse({
      visitors: Number(active?.visitors ?? 0),
      timestamp: Date.now(),
    });
  }

  // GET /analytics/realtime - Get realtime data (last 30 minutes)
  if (normalizedRoute === "/realtime") {
    if (req.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    const res = await umamiFetch(`/realtime/${umamiWebsiteId}`, {});

    if (!res.ok) return jsonResponse(res.body, { status: res.status });

    // Umami returns: { countries, urls, referrers, events, series, totals, timestamp }
    const realtime = res.body as {
      countries: Record<string, number>;
      urls: Record<string, number>;
      referrers: Record<string, number>;
      events: Array<{
        __type: string;
        sessionId: string;
        eventName: string;
        createdAt: string;
        browser: string;
        os: string;
        device: string;
        country: string;
        urlPath: string;
        referrerDomain: string;
      }>;
      series: {
        views: Array<{ x: string; y: number }>;
        visitors: Array<{ x: string; y: number }>;
      };
      totals: {
        views: number;
        visitors: number;
        events: number;
        countries: number;
      };
      timestamp: number;
    };

    return jsonResponse(realtime);
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
