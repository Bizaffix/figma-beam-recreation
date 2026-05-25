// ============================================================
// QuiltMatch AI – Frontend Service Layer
// Calls the quiltmatch-ai Supabase Edge Function
// ============================================================

import { supabase } from "@/lib/supabase";
import { getBackendAccessToken } from "@/lib/backendAuth";
import type {
  QuiltMatchRequest,
  QuiltMatchResponse,
  StudentContext,
  RequestMetadata,
} from "@/types/quiltmatch";

/**
 * Call the QuiltMatch AI edge function with a student's free-text query.
 */
export async function searchQuiltMatch(
  query: string,
  studentContext?: Partial<StudentContext>,
): Promise<QuiltMatchResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  // Build the request payload
  const sessionId = crypto.randomUUID();
  const payload: QuiltMatchRequest = {
    student_query: query,
    student_context: {
      name: studentContext?.name || undefined,
      email: studentContext?.email || undefined,
      home_location: studentContext?.home_location || undefined,
      flexible_dates: studentContext?.flexible_dates ?? true,
      flexible_budget: studentContext?.flexible_budget ?? true,
    },
    request_metadata: {
      session_id: sessionId,
      source: "quiltmatch-page",
      client_time: new Date().toISOString(),
    },
  };

  // Always set Authorization header – use user session token if logged in,
  // otherwise fall back to the anon key (which is a valid JWT).
  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
  };

  const accessToken = getBackendAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const url = `${supabaseUrl}/functions/v1/quiltmatch-ai`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody?.error || `QuiltMatch search failed (${res.status})`
    );
  }

  const data = await res.json();
  return data as QuiltMatchResponse;
}

/**
 * Generate example queries for the search interface.
 */
export function getExampleQueries(): string[] {
  return [
    "3-day beginner quilt retreat near Asheville NC under $800 in April",
    "Weekend art quilt workshop in Portland with mountain views",
    "Advanced improv quilting retreat this summer, budget $1200",
    "Cozy beginner-friendly retreat with all meals included near Austin TX",
    "5-day modern quilting escape by the beach in California",
    "Faith-based quilting weekend for women under $600",
    "Solo-friendly healing retreat with private room near Salt Lake City",
    "Scrap busting weekend workshop near Charlotte NC in March",
  ];
}
