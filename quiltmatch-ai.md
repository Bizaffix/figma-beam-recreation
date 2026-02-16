import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---- Helpers ----

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Haversine distance in miles
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---- Groq-based Query Parsing (FREE – Llama 3.3 70B) ----

interface ParsedFilters {
  duration_days?: { min: number; max: number };
  skill_level?: string | null;
  location?: { city?: string; state?: string; country?: string; radius_miles?: number };
  dates?: { preferred_start?: string; preferred_end?: string; flex_days?: number };
  budget_max?: number | null;
  themes?: string[];
  amenities?: string[];
  vibe?: string | null;
}

async function parseQueryWithGroq(
  studentQuery: string,
  studentContext: Record<string, unknown>,
): Promise<ParsedFilters> {
  const groqKey = Deno.env.get("GROQ_API_KEY");

  if (!groqKey) {
    console.warn("GROQ_API_KEY not set – using fallback regex parser");
    return fallbackParse(studentQuery);
  }

  const systemPrompt = `You are QuiltMatch AI, a query parser for BookMyQuiltRetreat.com.
Parse the student's quilting retreat search query into a structured JSON filter object.

Extract and infer:
- duration_days: { min, max } (e.g. "3-day" → {min:3,max:3}, "weekend" → {min:2,max:4})
- skill_level: "beginner" | "intermediate" | "advanced" | null
- location: { city, state, country, radius_miles } (default radius 100 for "near", 250 for "driving distance")
- dates: { preferred_start (ISO), preferred_end (ISO), flex_days }. Use year 2026 unless specified.
  If flexible_dates in context, set flex_days=30. If month only, use start/end of that month.
- budget_max: number or null
- themes: array of keywords like "modern", "traditional", "improv", "art quilt", "healing", "faith-based", etc.
- amenities: array like "mountain_view", "all_meals_included", "private_room", "onsite_longarm", etc.
- vibe: string like "intimate", "high_energy", "quiet", "social", etc. or null

Return ONLY valid JSON, no extra text. Example:
{
  "duration_days": { "min": 2, "max": 4 },
  "skill_level": "beginner",
  "location": { "city": "Asheville", "state": "NC", "radius_miles": 100 },
  "dates": { "preferred_start": "2026-04-01", "preferred_end": "2026-04-30", "flex_days": 30 },
  "budget_max": 800,
  "themes": ["modern", "scrappy"],
  "amenities": ["mountain_view", "all_meals_included"],
  "vibe": "intimate"
}`;

  const userMessage = `Student query: "${studentQuery}"
Student context: ${JSON.stringify(studentContext)}
Today's date: ${new Date().toISOString().split("T")[0]}`;

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
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("Groq API error:", res.status, await res.text());
      return fallbackParse(studentQuery);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ParsedFilters;
    }
    return fallbackParse(studentQuery);
  } catch (err) {
    console.error("Groq parse error:", err);
    return fallbackParse(studentQuery);
  }
}

function fallbackParse(query: string): ParsedFilters {
  const q = query.toLowerCase();
  const filters: ParsedFilters = {
    themes: [],
    amenities: [],
  };

  // Duration
  const durationMatch = q.match(/(\d+)\s*-?\s*day/);
  if (durationMatch) {
    const d = parseInt(durationMatch[1]);
    filters.duration_days = { min: d, max: d };
  } else if (q.includes("weekend")) {
    filters.duration_days = { min: 2, max: 4 };
  }

  // Skill level
  if (q.includes("beginner") || q.includes("newbie") || q.includes("first retreat")) {
    filters.skill_level = "beginner";
  } else if (q.includes("advanced") || q.includes("masterclass")) {
    filters.skill_level = "advanced";
  } else if (q.includes("intermediate")) {
    filters.skill_level = "intermediate";
  }

  // Budget
  const budgetMatch = q.match(/under\s*\$?\s*(\d+)/i) || q.match(/\$?\s*(\d+)\s*budget/i);
  if (budgetMatch) {
    filters.budget_max = parseInt(budgetMatch[1]);
  }

  // Location – try "near CITY STATE" or "in CITY STATE"
  const locMatch = q.match(/(?:near|in|around)\s+([A-Za-z\s]+?)(?:\s+(?:under|for|in|with|during)|$)/i);
  if (locMatch) {
    const parts = locMatch[1].trim().split(/,?\s+/);
    if (parts.length >= 2) {
      const state = parts.pop()!.toUpperCase();
      const city = parts.join(" ");
      filters.location = { city, state, radius_miles: 100 };
    } else if (parts.length === 1) {
      filters.location = { state: parts[0].toUpperCase(), radius_miles: 250 };
    }
  }

  // Dates – month names
  const months: Record<string, [string, string]> = {
    january: ["01-01", "01-31"], february: ["02-01", "02-28"],
    march: ["03-01", "03-31"], april: ["04-01", "04-30"],
    may: ["05-01", "05-31"], june: ["06-01", "06-30"],
    july: ["07-01", "07-31"], august: ["08-01", "08-31"],
    september: ["09-01", "09-30"], october: ["10-01", "10-31"],
    november: ["11-01", "11-30"], december: ["12-01", "12-31"],
  };
  for (const [month, [start, end]] of Object.entries(months)) {
    if (q.includes(month) || q.includes(month.substring(0, 3))) {
      const year = new Date().getFullYear();
      filters.dates = {
        preferred_start: `${year}-${start}`,
        preferred_end: `${year}-${end}`,
        flex_days: 30,
      };
      break;
    }
  }

  // Themes
  const themeKeywords = ["modern", "traditional", "improv", "art quilt", "scrappy", "scrap busting",
    "faith-based", "healing", "nature", "mountains", "beach", "community", "solo-friendly"];
  for (const t of themeKeywords) {
    if (q.includes(t)) filters.themes!.push(t.replace(/\s+/g, "_"));
  }

  // Amenities
  const amenityKeywords = ["pool", "spa", "mountain view", "private room", "shared room", "all meals",
    "onsite longarm", "fabric shop", "sewing room"];
  for (const a of amenityKeywords) {
    if (q.includes(a)) filters.amenities!.push(a.replace(/\s+/g, "_"));
  }

  // Vibe
  if (q.includes("quiet") || q.includes("peaceful")) filters.vibe = "quiet";
  else if (q.includes("intimate") || q.includes("cozy")) filters.vibe = "intimate";
  else if (q.includes("high energy") || q.includes("social")) filters.vibe = "high_energy";

  return filters;
}

// ---- Database Query Logic ----

interface MatchResult {
  event: Record<string, unknown>;
  venue: Record<string, unknown> | null;
  organizer: Record<string, unknown> | null;
  distance_miles?: number;
  match_score: number;
  confidence: string;
  reasons: string[];
}

async function queryEvents(
  supabaseClient: ReturnType<typeof createClient>,
  filters: ParsedFilters,
): Promise<MatchResult[]> {
  // Build the base query
  let query = supabaseClient
    .from("retreats")
    .select(`
      *,
      profiles:instructor_id (
        id, full_name, email, bio, specialty_styles, instagram_handle,
        events_hosted, avatar_url
      )
    `)
    .eq("published", true)
    .order("created_at", { ascending: false });

  // Skill level filter
  if (filters.skill_level) {
    // Try both 'level' and 'skill_level' columns
    query = query.or(
      `level.ilike.%${filters.skill_level}%,skill_level.ilike.%${filters.skill_level}%`
    );
  }

  // Budget filter
  if (filters.budget_max) {
    query = query.lte("price", filters.budget_max);
  }

  const { data: events, error } = await query.limit(50);

  if (error) {
    console.error("Error querying events:", error);
    return [];
  }

  if (!events || events.length === 0) return [];

  // Post-process: score and filter
  const results: MatchResult[] = [];

  for (const event of events) {
    let score = 50; // base score
    const reasons: string[] = [];
    let confidence = "high";

    // Ratings bonus
    const rating = event.ratings_avg ?? 4.5; // default if no rating
    if (rating >= 4.5) {
      score += 20;
      reasons.push("Highly rated retreat");
    } else if (rating >= 4.2) {
      score += 10;
    } else if (rating < 4.0) {
      score -= 20;
      confidence = "low";
    }

    // Duration match
    if (filters.duration_days) {
      const eventDuration = parseDurationDays(event.duration);
      if (eventDuration >= filters.duration_days.min && eventDuration <= filters.duration_days.max) {
        score += 15;
        reasons.push(`${eventDuration}-day retreat matches your duration preference`);
      } else if (Math.abs(eventDuration - filters.duration_days.min) <= 2) {
        score += 5;
        confidence = score > 70 ? "medium" : confidence;
      } else {
        score -= 10;
      }
    }

    // Skill level match
    if (filters.skill_level) {
      const eventLevel = (event.level || event.skill_level || "").toLowerCase();
      if (eventLevel.includes(filters.skill_level)) {
        score += 15;
        reasons.push(`${capitalize(filters.skill_level)}-friendly`);
      } else if (isAdjacentLevel(filters.skill_level, eventLevel)) {
        score += 5;
      }
    }

    // Budget match
    if (filters.budget_max && event.price) {
      if (event.price <= filters.budget_max) {
        score += 10;
        reasons.push(`Under your $${filters.budget_max} budget`);
      }
    }

    // Location match (text-based for now; geo-matching requires lat/lon)
    if (filters.location) {
      const eventLocation = (event.location || "").toLowerCase();
      const targetCity = (filters.location.city || "").toLowerCase();
      const targetState = (filters.location.state || "").toLowerCase();

      if (targetCity && eventLocation.includes(targetCity)) {
        score += 20;
        reasons.push(`Located in ${filters.location.city}, ${filters.location.state}`);
      } else if (targetState && eventLocation.includes(targetState)) {
        score += 10;
        reasons.push(`Located in ${filters.location.state}`);
      }
    }

    // Theme match
    if (filters.themes && filters.themes.length > 0) {
      const eventThemes = event.theme || [];
      const eventDesc = (event.description || "").toLowerCase() + " " + (event.title || "").toLowerCase();
      let themeMatches = 0;
      for (const theme of filters.themes) {
        const t = theme.replace(/_/g, " ");
        if (eventThemes.includes(theme) || eventThemes.includes(t) || eventDesc.includes(t)) {
          themeMatches++;
        }
      }
      if (themeMatches > 0) {
        score += themeMatches * 5;
        reasons.push(`Matches ${themeMatches} of your style preferences`);
      }
    }

    // Date match
    if (filters.dates?.preferred_start && event.date) {
      // Simple text-based date comparison
      const eventDateStr = (event.date || "").toLowerCase();
      const monthNames = ["jan", "feb", "mar", "apr", "may", "jun",
        "jul", "aug", "sep", "oct", "nov", "dec"];
      const prefMonth = parseInt(filters.dates.preferred_start.split("-")[1]) - 1;
      if (eventDateStr.includes(monthNames[prefMonth])) {
        score += 10;
        reasons.push("Falls within your preferred dates");
      }
    }

    // Spots available
    const spotsAvail = event.spots_available ?? (event.total_spots - (event.seats_booked ?? 0));
    if (spotsAvail <= 0) continue; // skip sold out

    // Determine confidence
    if (score >= 80) confidence = "high";
    else if (score >= 60) confidence = confidence === "low" ? "low" : "medium";
    else confidence = "low";

    // Only include if score is reasonable
    if (score >= 30) {
      results.push({
        event,
        venue: null, // We'll enrich with venue data if venue_id exists
        organizer: event.profiles || null,
        match_score: Math.min(score, 100),
        confidence,
        reasons,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.match_score - a.match_score);

  return results.slice(0, 3);
}

function parseDurationDays(duration: string | null): number {
  if (!duration) return 3; // default
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1]) : 3;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isAdjacentLevel(target: string, actual: string): boolean {
  const levels = ["beginner", "intermediate", "advanced"];
  const ti = levels.indexOf(target);
  const ai = levels.findIndex((l) => actual.includes(l));
  return ti >= 0 && ai >= 0 && Math.abs(ti - ai) <= 1;
}

// ---- Demo Listing Generation ----

async function generateDemoListing(
  supabaseClient: ReturnType<typeof createClient>,
  filters: ParsedFilters,
): Promise<Record<string, unknown> | null> {
  // Try to find a suitable venue near the requested location
  // Note: venues are stored in the "properties" table
  let venueQuery = supabaseClient
    .from("properties")
    .select("*")
    .in("status", ["published", "verified"])
    .order("ratings_avg", { ascending: false })
    .limit(5);

  const { data: venues } = await venueQuery;

  if (!venues || venues.length === 0) {
    // No venues at all; return a purely hypothetical demo
    return buildHypotheticalDemo(filters);
  }

  // Pick best venue – prefer one in the target location
  let bestVenue = venues[0];
  if (filters.location) {
    const targetState = (filters.location.state || "").toLowerCase();
    const targetCity = (filters.location.city || "").toLowerCase();
    for (const v of venues) {
      const loc = (v.location || v.property_name || "").toLowerCase();
      if (targetCity && loc.includes(targetCity)) {
        bestVenue = v;
        break;
      }
      if (targetState && loc.includes(targetState)) {
        bestVenue = v;
        break;
      }
    }
  }

  // Compute average price from similar events
  const { data: priceRef } = await supabaseClient
    .from("retreats")
    .select("price")
    .eq("published", true)
    .limit(20);

  const avgPrice = priceRef && priceRef.length > 0
    ? Math.round(priceRef.reduce((sum: number, e: { price: number }) => sum + (e.price || 0), 0) / priceRef.length)
    : 750;

  const demoPrice = filters.budget_max
    ? Math.min(avgPrice, filters.budget_max)
    : avgPrice;

  const durationDays = filters.duration_days?.min || 3;
  const skillLevel = filters.skill_level || "beginner";

  // Dates
  const startDate = filters.dates?.preferred_start || getNextFriday();
  const endDate = filters.dates?.preferred_end || addDays(startDate, durationDays);

  const locationCity = filters.location?.city || extractCity(bestVenue.location || bestVenue.property_name || "");
  const locationState = filters.location?.state || "";

  return {
    id: `demo_event_${Date.now()}`,
    type: "demo",
    title: `${capitalize(skillLevel)} ${durationDays}-Day Quilt Retreat at ${bestVenue.property_name || "Partner Venue"}`,
    skill_level: skillLevel,
    theme: filters.themes || ["community", "creative"],
    duration_days: durationDays,
    dates: {
      start: startDate,
      end: endDate,
    },
    price_per_seat: demoPrice,
    currency: "USD",
    location: {
      city: locationCity,
      state: locationState,
      country: "USA",
    },
    venue: {
      id: bestVenue.id,
      name: bestVenue.property_name || "Partner Venue",
      amenities: bestVenue.amenities || [],
      ratings_avg: bestVenue.ratings_avg || 4.5,
    },
    organizer: {
      id: null,
      name: null,
      ratings_avg: null,
    },
    status: "demo_organizer_invited",
    match_confidence: "hypothetical_high_demand",
    match_reasons: [
      "No current retreats match your exact filters",
      "This reflects what you asked for in location, budget, and vibe",
      "We're actively inviting organizers to host this retreat format",
    ],
    ratings_avg: bestVenue.ratings_avg || 4.5,
  };
}

function buildHypotheticalDemo(filters: ParsedFilters): Record<string, unknown> {
  const durationDays = filters.duration_days?.min || 3;
  const skillLevel = filters.skill_level || "beginner";
  const city = filters.location?.city || "Your Area";
  const state = filters.location?.state || "";

  return {
    id: `demo_event_${Date.now()}`,
    type: "demo",
    title: `${capitalize(skillLevel)} ${durationDays}-Day Quilt Retreat`,
    skill_level: skillLevel,
    theme: filters.themes || ["community"],
    duration_days: durationDays,
    dates: {
      start: filters.dates?.preferred_start || getNextFriday(),
      end: filters.dates?.preferred_end || addDays(getNextFriday(), durationDays),
    },
    price_per_seat: filters.budget_max || 750,
    currency: "USD",
    location: { city, state, country: "USA" },
    venue: { id: null, name: "Venue TBD", amenities: [], ratings_avg: null },
    organizer: { id: null, name: null, ratings_avg: null },
    status: "demo_organizer_invited",
    match_confidence: "hypothetical_high_demand",
    match_reasons: [
      "No current retreats or venues match your search",
      "This represents the retreat you're dreaming of",
      "We're growing our retreat map—check back soon!",
    ],
    ratings_avg: 0,
  };
}

function getNextFriday(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7) + 14); // 2 weeks out
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function extractCity(location: string): string {
  const parts = location.split(",");
  return parts[0]?.trim() || "Unknown";
}

// ---- Organizer Outreach ----

async function buildOutreachPayload(
  supabaseClient: ReturnType<typeof createClient>,
  filters: ParsedFilters,
  studentContext: Record<string, unknown>,
  createdDemo: boolean,
  matchCount: number,
): Promise<Record<string, unknown>> {
  const shouldOutreach = createdDemo || matchCount === 0;

  if (!shouldOutreach) {
    return {
      should_outreach: false,
      reason: null,
      human_friendly_query_summary: null,
      email_template: null,
      organizer_emails: [],
    };
  }

  // Find potential organizers to invite
  let orgQuery = supabaseClient
    .from("profiles")
    .select("id, full_name, email, specialty_styles, events_hosted")
    .eq("role", "instructor")
    .order("events_hosted", { ascending: false })
    .limit(10);

  const { data: organizers } = await orgQuery;

  // Filter by style match if possible
  const targetThemes = filters.themes || [];
  let matchedOrgs = (organizers || []).filter((org: Record<string, unknown>) => {
    const styles = (org.specialty_styles as string[]) || [];
    return targetThemes.some((t: string) =>
      styles.some((s: string) => s.toLowerCase().includes(t.replace(/_/g, " ")))
    );
  });

  // If no style matches, take top organizers by events_hosted
  if (matchedOrgs.length === 0) {
    matchedOrgs = (organizers || []).slice(0, 5);
  }

  const orgEmails = matchedOrgs
    .map((o: Record<string, unknown>) => o.email as string)
    .filter(Boolean)
    .slice(0, 10);

  const locationDesc = filters.location
    ? `${filters.location.city || ""}${filters.location.city && filters.location.state ? ", " : ""}${filters.location.state || ""}`
    : "their area";

  const durationDesc = filters.duration_days
    ? `${filters.duration_days.min}-day`
    : "";

  const skillDesc = filters.skill_level ? `${filters.skill_level}-friendly` : "";
  const budgetDesc = filters.budget_max ? `under $${filters.budget_max}` : "";
  const studentName = (studentContext.name as string) || "A quilter";

  const humanSummary = [
    `a ${durationDesc}`,
    skillDesc,
    "quilt retreat",
    locationDesc ? `near ${locationDesc}` : "",
    budgetDesc,
    filters.vibe ? `with ${filters.vibe} vibes` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    should_outreach: true,
    reason: createdDemo ? "no_perfect_match" : "low_supply",
    human_friendly_query_summary: humanSummary,
    email_template: {
      subject: `Quilters are searching for a retreat like yours near ${locationDesc}`,
      body: `Hi {{organizer_name}},\n\n${studentName} just told us what she's longing for: ${humanSummary}.\n\nRight now, BookMyQuiltRetreat.com doesn't have a perfect retreat for her in ${locationDesc}—but your style and past events look like a beautiful fit.\n\nWould you like to claim a free featured listing for a retreat like this? We'll:\n- Help you set up dates and details in just a few clicks.\n- Match you with quilters already searching for this experience.\n- Share promotion tools so you can fill seats without extra admin.\n\nIf this sparks ideas, reply to this email or click here to start your listing: {{organizer_signup_link}}.\n\nWith gratitude for the way you gather and care for quilters,\nBookMyQuiltRetreat.com`,
    },
    organizer_emails: orgEmails,
  };
}

// ---- Quality Score ----

function computeQualityScore(
  matches: MatchResult[],
  createdDemo: boolean,
  filters: ParsedFilters,
): number {
  if (matches.length === 0 && !createdDemo) return 10;
  if (matches.length === 0 && createdDemo) return 25;

  let score = 0;

  // Base on number of real matches
  score += matches.length * 20; // up to 60 for 3 matches

  // Average match score
  const avgMatchScore = matches.reduce((s, m) => s + m.match_score, 0) / matches.length;
  score += Math.round(avgMatchScore * 0.3);

  // Confidence bonus
  const highConfCount = matches.filter((m) => m.confidence === "high").length;
  score += highConfCount * 5;

  // Demo penalty
  if (createdDemo) score -= 15;

  return Math.max(0, Math.min(100, score));
}

// ---- Format for Frontend ----

function formatMatchForFrontend(result: MatchResult): Record<string, unknown> {
  const e = result.event;
  const org = result.organizer as Record<string, unknown> | null;

  const durationDays = parseDurationDays(e.duration as string);

  return {
    id: e.id,
    type: "real",
    title: e.title,
    skill_level: (e.level || e.skill_level || "beginner").toLowerCase(),
    theme: e.theme || [],
    duration_days: durationDays,
    dates: {
      start: e.date || "",
      end: "",
    },
    price_per_seat: e.price,
    currency: "USD",
    location: {
      city: extractCity(e.location as string || ""),
      state: extractState(e.location as string || ""),
      country: "USA",
      distance_miles_from_search: result.distance_miles,
    },
    venue: e.venue_id
      ? { id: e.venue_id, name: "", amenities: e.amenities || [], ratings_avg: e.ratings_avg || 0 }
      : { id: null, name: e.location || "", amenities: e.amenities || [], ratings_avg: e.ratings_avg || 0 },
    organizer: org
      ? {
          id: org.id,
          name: org.full_name,
          ratings_avg: null,
          specialty_styles: org.specialty_styles || [],
        }
      : { id: null, name: null, ratings_avg: null },
    ratings_avg: e.ratings_avg || 4.5,
    match_confidence: result.confidence,
    match_reasons: result.reasons,
    book_now_url: e.booking_url || `https://www.bookmyquiltretreat.com/retreat/${e.id}`,
    image: e.image,
    description: e.description,
    includes: e.includes || [],
    spots_available: e.spots_available,
    total_spots: e.total_spots,
  };
}

function extractState(location: string): string {
  const parts = location.split(",");
  return parts.length >= 2 ? parts[1]?.trim() || "" : "";
}

// ---- Main Handler ----

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { student_query, student_context, request_metadata } = body;

    if (!student_query || typeof student_query !== "string") {
      return jsonResponse({ error: "student_query is required" }, 400);
    }

    // Initialize Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Parse the query with Groq (free) or fallback regex
    const parsedFilters = await parseQueryWithGroq(
      student_query,
      student_context || {},
    );

    // Step 2: Query events
    const matchResults = await queryEvents(supabaseClient, parsedFilters);

    // Step 3: Decide demo vs real
    const strongMatches = matchResults.filter(
      (m) => m.confidence === "high" || m.confidence === "medium",
    );
    let demoListing = null;
    let createdDemo = false;

    if (strongMatches.length === 0) {
      demoListing = await generateDemoListing(supabaseClient, parsedFilters);
      createdDemo = demoListing !== null;
    }

    // Step 4: Format matches
    const formattedMatches = matchResults.map(formatMatchForFrontend);

    // Step 5: Build outreach
    const outreachPayload = await buildOutreachPayload(
      supabaseClient,
      parsedFilters,
      student_context || {},
      createdDemo,
      matchResults.length,
    );

    // Step 6: Quality score
    const qualityScore = computeQualityScore(
      matchResults,
      createdDemo,
      parsedFilters,
    );

    // Step 7: Build frontend notes
    const notesForFrontend: string[] = [];
    if (formattedMatches.length === 0 && demoListing) {
      notesForFrontend.push(
        "We're inviting organizers to host this exact retreat.",
      );
    }
    if (qualityScore < 40) {
      notesForFrontend.push(
        "Refine query or check back soon. We're still growing our retreat map.",
      );
    }
    if (formattedMatches.length > 0 && formattedMatches.length < 3) {
      notesForFrontend.push(
        "We found a few matches. Adjusting your dates or budget may reveal more options.",
      );
    }

    // Log the query for flywheel
    try {
      await supabaseClient.from("student_query_log").insert({
        raw_query: student_query,
        parsed_filters_json: parsedFilters,
        student_name: student_context?.name || null,
        student_email: student_context?.email || null,
        home_location: student_context?.home_location || null,
        session_id: request_metadata?.session_id || null,
        source: request_metadata?.source || "homepage-widget",
        matched_event_ids: matchResults.map((m) => m.event.id),
        created_demo: createdDemo,
        quality_score: qualityScore,
      });
    } catch (logErr) {
      console.error("Failed to log query:", logErr);
      // Non-fatal: don't fail the response
    }

    // Step 8: Final response
    const response = {
      parsed_filters: parsedFilters,
      matches: formattedMatches,
      demo_listing: demoListing,
      outreach_payload: outreachPayload,
      meta: {
        quality_score: qualityScore,
        created_demo: createdDemo,
        notes_for_frontend: notesForFrontend,
      },
    };

    return jsonResponse(response);
  } catch (err) {
    console.error("QuiltMatch AI error:", err);
    return jsonResponse(
      {
        error: "Internal server error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  }
});