// ============================================================
// QuiltMatch Discover – Frontend Service Layer
// Calls the quiltmatch-discover edge function + manages interests
// ============================================================

import { supabase } from "@/lib/supabase";
import type {
  DiscoverRequest,
  DiscoverResponse,
  ExpressInterestPayload,
  ListingInterest,
  DraftListing,
} from "@/types/draft-listing";

/**
 * Search the web for quilt retreats matching the query.
 */
export async function discoverRetreats(
  request: DiscoverRequest,
): Promise<DiscoverResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
  };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.access_token) {
      headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
    }
  } catch {
    // Anon key already set
  }

  const url = `${supabaseUrl}/functions/v1/quiltmatch-discover`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error || `Discovery search failed (${res.status})`);
  }

  return (await res.json()) as DiscoverResponse;
}

/**
 * Express interest in a draft listing.
 * Calls the quiltmatch-interest edge function which:
 *  1. Saves the interest (using service role — no RLS issues)
 *  2. Sends an invite email to the organizer with claim link
 *  3. Returns rich response with email status
 */
export interface InterestResponse {
  success: boolean;
  interest: ListingInterest;
  email_sent: boolean;
  claim_url: string;
  total_interests: number;
  message: string;
}

export async function expressInterest(
  payload: ExpressInterestPayload,
): Promise<InterestResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
  };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.access_token) {
      headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
    }
  } catch {
    // Anon key already set
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/quiltmatch-interest`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      draft_listing_id: payload.draft_listing_id,
      student_name: payload.student_name || null,
      student_email: payload.student_email || null,
      student_message: payload.student_message || null,
      contact_preference: payload.contact_preference || "platform",
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error || `Failed to express interest (${res.status})`);
  }

  return (await res.json()) as InterestResponse;
}

/**
 * Get interest count for a draft listing.
 */
export async function getInterestCount(draftListingId: string): Promise<number> {
  const { count, error } = await supabase
    .from("listing_interests")
    .select("*", { count: "exact", head: true })
    .eq("draft_listing_id", draftListingId);

  if (error) return 0;
  return count || 0;
}

/**
 * Fetch a single draft listing by invite token (for claim page).
 */
export async function getDraftByToken(token: string): Promise<DraftListing | null> {
  const { data, error } = await supabase
    .from("draft_listings")
    .select("*")
    .eq("invite_token", token)
    .single();

  if (error || !data) return null;
  return data as DraftListing;
}

/**
 * Fetch all draft listings (for browse/admin).
 */
export async function getDraftListings(
  status?: string,
  limit = 20,
): Promise<DraftListing[]> {
  let query = supabase
    .from("draft_listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []) as DraftListing[];
}
