// ============================================================
// QuiltMatch Discover – Supabase Edge Function
// Searches the public web for quilt retreats, extracts data
// with Groq (free), creates draft listings.
// Uses Serper.dev (free 2,500 searches) for Google results.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---- Step 1: Build Search Queries ----

function buildSearchQueries(query: string, location?: string, dates?: string): string[] {
  const queries: string[] = [];
  const loc = location || "";
  const dateStr = dates || "";

  // Primary query
  queries.push(`${loc} quilt retreat ${dateStr} ${query}`.trim());

  // Variations
  if (loc) {
    queries.push(`quilting retreat near ${loc} ${dateStr}`.trim());
    queries.push(`${loc} quilting venue rental sewing retreat`.trim());
  }

  // Generic fallback
  queries.push(`quilt retreat ${query} registration open`.trim());

  // Limit to 3 queries to conserve free API credits
  return queries.slice(0, 3);
}

// ---- Step 2: Search Web via Serper.dev (FREE) ----

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

async function searchWeb(query: string, serperKey: string): Promise<SearchResult[]> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": serperKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 5,
      }),
    });

    if (!res.ok) {
      console.error("Serper API error:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const organic = data.organic || [];

    return organic.map((r: Record<string, unknown>) => ({
      title: r.title as string || "",
      link: r.link as string || "",
      snippet: r.snippet as string || "",
      position: r.position as number || 0,
    }));
  } catch (err) {
    console.error("Serper search error:", err);
    return [];
  }
}

// ---- Step 3: Extract Listing Data with Groq (FREE) ----

interface ExtractedListing {
  title: string;
  description: string;
  pricing: string;
  dates: string;
  location_city: string;
  location_region: string;
  rooming: string;
  organizer_name: string;
  organizer_email: string;
  organizer_website: string;
  extraction_confidence: "high" | "medium" | "low";
  is_quilt_retreat: boolean;
}

async function extractListingData(
  searchResults: SearchResult[],
  originalQuery: string,
  groqKey: string,
): Promise<{ extracted: ExtractedListing; source: SearchResult }[]> {
  if (!groqKey || searchResults.length === 0) return [];

  const resultsText = searchResults
    .map((r, i) => `[${i + 1}] Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`)
    .join("\n\n");

  const systemPrompt = `You are a data extraction engine for BookMyQuiltRetreat.com.
You receive Google search results about potential quilt retreats.
For EACH result that appears to be a real quilt retreat or quilting venue, extract structured data.

Rules:
- Only extract results that are ACTUALLY quilt/quilting retreats, sewing retreats, or retreat venues
- Skip results that are blog posts about quilting tips, product pages, or unrelated content
- Use ONLY information visible in the title and snippet (don't make up data)
- If a field isn't available, use the default values shown below
- extraction_confidence: "high" if title+snippet clearly describe a retreat with dates/pricing, "medium" if it's a retreat but missing details, "low" if uncertain

Return a JSON array. Each element:
{
  "result_index": 1,
  "is_quilt_retreat": true,
  "title": "Retreat Name",
  "description": "1-2 sentence description from snippet",
  "pricing": "$X/person" or "Contact organizer",
  "dates": "Month Day-Day, Year" or "Flexible—ask organizer",
  "location_city": "City",
  "location_region": "State or Region",
  "rooming": "Private rooms" or "Ask about options",
  "organizer_name": "Name if visible" or "",
  "organizer_email": "" (only if publicly visible in snippet),
  "organizer_website": "domain from URL",
  "extraction_confidence": "high" | "medium" | "low"
}

Return ONLY valid JSON array, no extra text. If no results are quilt retreats, return [].`;

  const userMessage = `Student searched for: "${originalQuery}"

Search results:
${resultsText}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("Groq extraction error:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Parse JSON – might be wrapped in { "results": [...] } or just [...]
    let parsed: ExtractedListing[];
    try {
      const jsonData = JSON.parse(content);
      if (Array.isArray(jsonData)) {
        parsed = jsonData;
      } else if (jsonData.results && Array.isArray(jsonData.results)) {
        parsed = jsonData.results;
      } else if (jsonData.listings && Array.isArray(jsonData.listings)) {
        parsed = jsonData.listings;
      } else {
        // Try to find an array in the object values
        const arrays = Object.values(jsonData).filter(Array.isArray);
        parsed = arrays.length > 0 ? arrays[0] as ExtractedListing[] : [];
      }
    } catch {
      console.error("Failed to parse Groq response:", content);
      return [];
    }

    // Map back to search results
    return parsed
      .filter((item) => item.is_quilt_retreat !== false)
      .map((item) => {
        const idx = (item as Record<string, unknown>).result_index as number;
        const sourceResult = searchResults[idx ? idx - 1 : 0] || searchResults[0];
        return {
          extracted: item,
          source: sourceResult,
        };
      });
  } catch (err) {
    console.error("Groq extraction error:", err);
    return [];
  }
}

// ---- Step 4: Deduplicate and Store ----

function generateInviteToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function storeDraftListings(
  supabaseClient: ReturnType<typeof createClient>,
  listings: { extracted: ExtractedListing; source: SearchResult }[],
  originalQuery: string,
): Promise<Record<string, unknown>[]> {
  const stored: Record<string, unknown>[] = [];

  for (const { extracted, source } of listings) {
    // Check for duplicates by source_url
    const { data: existing } = await supabaseClient
      .from("draft_listings")
      .select("id, status")
      .eq("source_url", source.link)
      .limit(1);

    if (existing && existing.length > 0) {
      // Already exists – return existing
      stored.push(existing[0]);
      continue;
    }

    // Insert new draft listing
    const { data: inserted, error } = await supabaseClient
      .from("draft_listings")
      .insert({
        title: extracted.title || source.title,
        description: extracted.description || source.snippet,
        pricing: extracted.pricing || "Contact organizer",
        dates: extracted.dates || "Flexible—ask organizer",
        location_city: extracted.location_city || null,
        location_region: extracted.location_region || null,
        rooming: extracted.rooming || null,
        source_url: source.link,
        extraction_confidence: extracted.extraction_confidence || "medium",
        organizer_name: extracted.organizer_name || null,
        organizer_email: extracted.organizer_email || null,
        organizer_website: extracted.organizer_website || source.link,
        invite_token: generateInviteToken(),
        discovered_from_query: originalQuery,
        search_result_snippet: source.snippet,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing draft listing:", error);
      continue;
    }

    if (inserted) stored.push(inserted);
  }

  return stored;
}

// ---- Main Handler ----

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { query, location, dates, group_size, rooming, skill_level } = body;

    if (!query || typeof query !== "string") {
      return jsonResponse({ error: "query is required" }, 400);
    }

    const serperKey = Deno.env.get("SERPER_API_KEY");
    const groqKey = Deno.env.get("GROQ_API_KEY");

    if (!serperKey) {
      return jsonResponse({
        error: "SERPER_API_KEY not configured. Get a free key at serper.dev",
      }, 500);
    }

    if (!groqKey) {
      return jsonResponse({
        error: "GROQ_API_KEY not configured. Get a free key at console.groq.com",
      }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Build search queries
    const fullQuery = [query, skill_level, rooming, group_size ? `group of ${group_size}` : ""]
      .filter(Boolean)
      .join(" ");
    const searchQueries = buildSearchQueries(fullQuery, location, dates);

    // Step 2: Search the web (run queries in sequence to stay within rate limits)
    let allResults: SearchResult[] = [];
    for (const sq of searchQueries) {
      const results = await searchWeb(sq, serperKey);
      allResults = allResults.concat(results);
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    allResults = allResults.filter((r) => {
      if (seen.has(r.link)) return false;
      seen.add(r.link);
      return true;
    });

    if (allResults.length === 0) {
      return jsonResponse({
        draft_listings: [],
        search_queries_used: searchQueries,
        total_results_found: 0,
        note: "No web results found. Try broadening your search.",
      });
    }

    // Step 3: Extract structured data with Groq
    const extracted = await extractListingData(allResults, query, groqKey);

    if (extracted.length === 0) {
      return jsonResponse({
        draft_listings: [],
        search_queries_used: searchQueries,
        total_results_found: allResults.length,
        note: "Found web results but none appeared to be quilt retreats. Try different keywords.",
      });
    }

    // Step 4: Store as draft listings
    const stored = await storeDraftListings(supabaseClient, extracted, query);

    // Step 5: Fetch full draft listings with interest counts
    const draftIds = stored.map((s) => s.id);
    const { data: fullDrafts } = await supabaseClient
      .from("draft_listings")
      .select("*")
      .in("id", draftIds);

    return jsonResponse({
      draft_listings: fullDrafts || stored,
      search_queries_used: searchQueries,
      total_results_found: allResults.length,
      note: `Found ${extracted.length} potential retreat(s) from ${allResults.length} web results.`,
    });
  } catch (err) {
    console.error("QuiltMatch Discover error:", err);
    return jsonResponse(
      { error: "Internal server error", message: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});
