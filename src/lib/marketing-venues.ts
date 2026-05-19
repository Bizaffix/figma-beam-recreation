import { format, isValid, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";

export type MarketingVenue = {
  id: string;
  name: string;
  location: string;
  availableLabel: string;
  image: string | null;
  sleeps: number | null;
};

type PropertyRow = {
  id: string;
  property_name: string;
  location: string;
  availability_calendar: string[] | null;
  photos: string[] | null;
  sleeps: number | null;
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

function pickFirstPhoto(photos: string[] | null): string | null {
  if (!photos || photos.length === 0) return null;
  const first = photos.find((p) => typeof p === "string" && p.trim());
  return first ? first.trim() : null;
}

/** Published/verified venues from `properties` (same as Browse). */
export async function fetchHomepageVenues(): Promise<MarketingVenue[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("id, property_name, location, availability_calendar, photos, sleeps")
    .in("status", ["published", "verified"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchHomepageVenues:", error);
    return [];
  }

  return ((data ?? []) as PropertyRow[]).map((row) => ({
    id: row.id,
    name: (row.property_name ?? "").trim() || "Untitled venue",
    location: formatVenueLocationLabel(row.location ?? ""),
    availableLabel: formatNextAvailableLabel(row.availability_calendar),
    image: pickFirstPhoto(row.photos),
    sleeps: typeof row.sleeps === "number" ? row.sleeps : null,
  }));
}
