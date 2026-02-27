// ============================================================
// QuiltMatch AI – TypeScript Types
// Matches the full JSON response shape from the edge function
// ============================================================

// ---- Input Types ----

export interface StudentContext {
  name?: string;
  email?: string;
  home_location?: string;
  preferences?: string;
  flexible_dates?: boolean;
  flexible_budget?: boolean;
}

export interface RequestMetadata {
  session_id: string;
  source: string;
  client_time: string;
}

export interface QuiltMatchRequest {
  student_query: string;
  student_context: StudentContext;
  request_metadata: RequestMetadata;
}

// ---- Parsed Filters ----

export interface ParsedLocationFilter {
  city?: string;
  state?: string;
  country?: string;
  radius_miles?: number;
}

export interface ParsedDateFilter {
  preferred_start?: string;
  preferred_end?: string;
  flex_days?: number;
}

export interface ParsedDurationFilter {
  min?: number;
  max?: number;
}

export interface ParsedFilters {
  duration_days?: ParsedDurationFilter;
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | null;
  location?: ParsedLocationFilter;
  dates?: ParsedDateFilter;
  budget_max?: number | null;
  themes?: string[];
  amenities?: string[];
  vibe?: string | null;
}

// ---- Match / Event Types ----

export interface MatchVenue {
  id: string;
  name: string;
  amenities: string[];
  ratings_avg: number;
}

export interface MatchOrganizer {
  id: string | null;
  name: string | null;
  ratings_avg: number | null;
  specialty_styles?: string[];
}

export interface MatchLocation {
  city: string;
  state: string;
  country: string;
  distance_miles_from_search?: number;
}

export interface MatchDates {
  start: string;
  end: string;
}

export type MatchConfidence = 'high' | 'medium' | 'low' | 'hypothetical_high_demand';

export interface MatchEvent {
  id: string;
  type: 'real' | 'demo';
  title: string;
  skill_level: string;
  theme: string[];
  duration_days: number;
  dates: MatchDates;
  price_per_seat: number;
  currency: string;
  location: MatchLocation;
  venue: MatchVenue;
  organizer: MatchOrganizer;
  ratings_avg: number;
  match_confidence: MatchConfidence;
  match_reasons: string[];
  book_now_url?: string;
  status?: string;
}

// ---- Outreach Payload ----

export interface OutreachEmailTemplate {
  subject: string;
  body: string;
}

export interface OutreachPayload {
  should_outreach: boolean;
  reason?: string;
  human_friendly_query_summary?: string;
  email_template?: OutreachEmailTemplate;
  organizer_emails?: string[];
}

// ---- Meta ----

export interface QuiltMatchMeta {
  quality_score: number;
  created_demo: boolean;
  notes_for_frontend: string[];
}

// ---- Full Response ----

export interface QuiltMatchResponse {
  parsed_filters: ParsedFilters;
  matches: MatchEvent[];
  demo_listing: MatchEvent | null;
  outreach_payload: OutreachPayload;
  meta: QuiltMatchMeta;
}
