const storageKey = (venueId: string) => `qm_venue_ical_feed_${venueId}`;

/** Backend only returns feedUrl on generate/regenerate; persist for active-state copy UI. */
export function getStoredVenueIcalFeedUrl(venueId: string): string | null {
  try {
    return sessionStorage.getItem(storageKey(venueId));
  } catch {
    return null;
  }
}

export function setStoredVenueIcalFeedUrl(venueId: string, feedUrl: string): void {
  try {
    sessionStorage.setItem(storageKey(venueId), feedUrl);
  } catch {
    // ignore quota / private mode
  }
}

export function clearStoredVenueIcalFeedUrl(venueId: string): void {
  try {
    sessionStorage.removeItem(storageKey(venueId));
  } catch {
    // ignore
  }
}
