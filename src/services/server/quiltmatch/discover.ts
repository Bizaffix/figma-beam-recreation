import { runApiEndpoint } from "@/redux/apiDispatch";
import { draftListingApi, quiltmatchApi } from "@/services/server";
import type {
  DiscoverRequest,
  DiscoverResponse,
  ExpressInterestPayload,
  DraftListing,
} from "@/types/draft-listing";

export async function discoverRetreats(request: DiscoverRequest): Promise<DiscoverResponse> {
  const data = await runApiEndpoint<DiscoverResponse>(quiltmatchApi.endpoints.searchQuiltMatch, {
    query: request.query,
    filters: {
      location: request.location,
      dates: request.dates,
      group_size: request.group_size,
      rooming: request.rooming,
      skill_level: request.skill_level,
    },
    limit: 20,
  });
  return data;
}

export interface InterestResponse {
  success: boolean;
  interest: import("@/types/draft-listing").ListingInterest;
  email_sent: boolean;
  claim_url: string;
  total_interests: number;
  message: string;
}

export async function expressInterest(payload: ExpressInterestPayload): Promise<InterestResponse> {
  const data = await runApiEndpoint<InterestResponse>(draftListingApi.endpoints.submitDraftListingInterest, {
    id: payload.draft_listing_id,
    body: {
      studentName: payload.student_name || null,
      studentEmail: payload.student_email || null,
      studentMessage: payload.student_message || null,
      contactPreference: payload.contact_preference || "platform",
    },
  });
  return data;
}

export async function getInterestCount(draftListingId: string): Promise<number> {
  try {
    const interests = await runApiEndpoint<Record<string, unknown>[]>(
      draftListingApi.endpoints.getDraftListingInterests,
      draftListingId,
    );
    return interests.length;
  } catch {
    return 0;
  }
}

export async function getDraftByToken(token: string): Promise<DraftListing | null> {
  try {
    const listing = await runApiEndpoint<DraftListing>(draftListingApi.endpoints.getDraftListingByToken, token);
    return listing ?? null;
  } catch {
    return null;
  }
}

export async function getDraftListings(status?: string, limit = 20): Promise<DraftListing[]> {
  try {
    const items = await runApiEndpoint<DraftListing[]>(draftListingApi.endpoints.getDraftListings, { status, limit });
    return items;
  } catch {
    return [];
  }
}
