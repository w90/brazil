import type { Listing } from "../types";

function readId(listing: Listing): string {
  return listing.id;
}

export function mergeListings(baseListings: Listing[], customListings: Listing[]): Listing[] {
  const merged = baseListings.slice();
  const ids = new Set(baseListings.map(readId));

  for (const listing of customListings) {
    const alreadyExists = ids.has(listing.id);
    if (alreadyExists) {
      continue;
    }

    merged.push(listing);
    ids.add(listing.id);
  }

  return merged;
}

export function findListingById(listings: Listing[], listingId: string | null): Listing | null {
  if (!listingId) {
    return null;
  }

  for (const listing of listings) {
    const isMatch = listing.id === listingId;
    if (isMatch) {
      return listing;
    }
  }

  return null;
}
