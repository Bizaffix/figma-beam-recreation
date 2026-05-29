import { format, isValid, parseISO } from "date-fns";

import { runApiEndpoint } from "@/redux/apiDispatch";

import { venueApi } from "@/services/server";



export type MarketingVenue = {

  id: string;

  name: string;

  location: string;

  availableLabel: string;

  image: string | null;

  sleeps: number | null;

};



type BackendVenue = {

  id: string;

  name: string;

  city?: string | null;

  state?: string | null;

  country?: string | null;

  coverImageUrl?: string | null;

  galleryImages?: string[];

  sleeps?: number | null;

  availabilityCalendar?: unknown;

};



export function formatVenueLocationLabel(location: string): string {

  const trimmed = location.trim();

  if (!trimmed) return "United States";

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 2) {

    const last = parts[parts.length - 1];

    if (last.length <= 20) return last;

  }

  return trimmed.length > 32 ? `${trimmed.slice(0, 29)}…` : trimmed;

}



function parseCalendarDate(value: string): Date | null {

  const raw = value.trim();

  if (!raw) return null;

  const iso = parseISO(raw);

  if (isValid(iso)) return iso;

  const native = new Date(raw);

  return isValid(native) ? native : null;

}



export function formatNextAvailableLabel(dates: string[] | null | undefined): string {

  const today = new Date();

  today.setHours(0, 0, 0, 0);



  const upcoming = (dates ?? [])

    .map(parseCalendarDate)

    .filter((d): d is Date => d !== null && d >= today)

    .sort((a, b) => a.getTime() - b.getTime());



  if (upcoming.length === 0) return "Open for bookings";

  return `Available ${format(upcoming[0], "MMM d")}`;

}



function buildVenueLocation(venue: BackendVenue): string {

  const parts = [venue.city, venue.state, venue.country].filter(

    (part): part is string => typeof part === "string" && part.trim().length > 0,

  );



  if (parts.length === 0) return "United States";

  return formatVenueLocationLabel(parts.join(", "));

}



function normalizeCalendarDates(calendar: unknown): string[] | null {

  if (!Array.isArray(calendar)) return null;

  return calendar.filter((entry): entry is string => typeof entry === "string");

}



function pickVenueImage(venue: BackendVenue): string | null {

  if (venue.coverImageUrl?.trim()) return venue.coverImageUrl.trim();

  const fromGallery = venue.galleryImages?.find((photo) => typeof photo === "string" && photo.trim());

  return fromGallery ? fromGallery.trim() : null;

}



function mapBackendVenue(venue: BackendVenue): MarketingVenue {

  return {

    id: venue.id,

    name: (venue.name ?? "").trim() || "Untitled venue",

    location: buildVenueLocation(venue),

    availableLabel: formatNextAvailableLabel(normalizeCalendarDates(venue.availabilityCalendar)),

    image: pickVenueImage(venue),

    sleeps: typeof venue.sleeps === "number" ? venue.sleeps : null,

  };

}



/** Published venues from backend `GET /api/venues`. */

export async function fetchHomepageVenues(): Promise<MarketingVenue[]> {

  try {

    const items = await runApiEndpoint<Record<string, unknown>[]>(venueApi.endpoints.getVenues, {

      limit: 60,

      sort: "createdAt:desc",

    });

    return items.map((venue) => mapBackendVenue(venue as BackendVenue));

  } catch (error) {

    console.error("fetchHomepageVenues:", error);

    return [];

  }

}


