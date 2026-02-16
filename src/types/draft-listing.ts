// ============================================================
// Draft Listing Discovery – TypeScript Types
// Web-scraped retreat listings, interest flow, claim flow
// ============================================================

// ---- Draft Listing ----

export type DraftListingStatus =
  | 'draft'
  | 'invited'
  | 'claimed'
  | 'pending_approval'
  | 'live'
  | 'rejected'
  | 'removed';

export type ExtractionConfidence = 'high' | 'medium' | 'low';

export interface DraftListing {
  id: string;
  status: DraftListingStatus;
  title: string;
  description: string | null;
  main_image_url: string | null;
  pricing: string;
  dates: string;
  location_city: string | null;
  location_region: string | null;
  location_country: string;
  rooming: string | null;
  source_url: string;
  extraction_confidence: ExtractionConfidence;
  organizer_name: string | null;
  organizer_email: string | null;
  organizer_phone: string | null;
  organizer_website: string | null;
  invite_token: string | null;
  invite_sent_at: string | null;
  claimed_at: string | null;
  approved_at: string | null;
  discovered_from_query: string | null;
  search_result_snippet: string | null;
  created_at: string;
  updated_at: string;
  // V2: Editable fields
  additional_images?: string[];
  amenities?: string[];
  skill_levels?: string[];
  max_capacity?: number | null;
  policies?: string | null;
  cancellation_policy?: string | null;
  deposit_info?: string | null;
  website_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  // V2: Application
  claimer_role?: string | null;
  application_about?: string | null;
  application_events_hosted?: string | null;
  application_notes?: string | null;
  // V2: Admin
  admin_notes?: string | null;
  review_flags?: string[];
  // V2: Expiry
  invite_expires_at?: string | null;
  invite_reminder_sent?: boolean;
  // Computed on frontend
  interest_count?: number;
}

// ---- Student Interest ----

export interface ListingInterest {
  id: string;
  draft_listing_id: string;
  student_id: string | null;
  student_name: string | null;
  student_email: string | null;
  student_message: string | null;
  contact_preference: 'email' | 'platform';
  created_at: string;
}

export interface ExpressInterestPayload {
  draft_listing_id: string;
  student_name?: string;
  student_email?: string;
  student_message?: string;
  contact_preference?: 'email' | 'platform';
}

// ---- Discovery Request/Response ----

export interface DiscoverRequest {
  query: string;
  location?: string;
  dates?: string;
  group_size?: number;
  rooming?: string;
  skill_level?: string;
}

export interface DiscoverResponse {
  draft_listings: DraftListing[];
  search_queries_used: string[];
  total_results_found: number;
  note: string;
}

// ---- Claim Flow ----

export interface ClaimListingPayload {
  token: string;
  listing_id: string;
  claimer_name: string;
  claimer_email: string;
  claimer_phone?: string;
  claimer_role: 'owner' | 'manager' | 'organizer' | 'venue_host';
}

// ---- Admin Review ----

export type AdminAction = 'approve' | 'request_edits' | 'reject' | 'flag';

export interface AdminReviewPayload {
  listing_id: string;
  action: AdminAction;
  message_to_organizer?: string;
}
