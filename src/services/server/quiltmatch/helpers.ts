import { runApiEndpoint } from "@/redux/apiDispatch";
import { quiltmatchApi } from "@/services/server";
import type { QuiltMatchRequest, QuiltMatchResponse, StudentContext } from "@/types/quiltmatch";

/**
 * Call the QuiltMatch AI backend search endpoint.
 */
export async function searchQuiltMatch(
  query: string,
  studentContext?: Partial<StudentContext>,
): Promise<QuiltMatchResponse> {
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
      session_id: crypto.randomUUID(),
      source: "quiltmatch-page",
      client_time: new Date().toISOString(),
    },
  };

  const data = await runApiEndpoint<Record<string, unknown>>(quiltmatchApi.endpoints.searchQuiltMatch, {
    query,
    filters: {},
    limit: 20,
  });

  if (data && ("matches" in data || "parsed_filters" in data)) {
    return data as unknown as QuiltMatchResponse;
  }

  const legacy = data as { results?: QuiltMatchResponse["matches"]; total?: number };
  return {
    ...payload,
    parsed_filters: {},
    matches: legacy.results ?? [],
    demo_listing: null,
    outreach_payload: null,
    meta: { total: legacy.total ?? 0 },
  } as unknown as QuiltMatchResponse;
}

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
