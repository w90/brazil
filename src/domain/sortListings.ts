import type { ListingSortDirection, ListingSortKey, ScoredListing } from "../types";

function readSortNumber(listing: ScoredListing, sortKey: ListingSortKey): number | null {
  const isPrice = sortKey === "price";
  if (isPrice) {
    return listing.price ?? null;
  }

  const isRating = sortKey === "rating";
  if (isRating) {
    return listing.rating;
  }

  return listing.qualityScore;
}

function compareWithMissingLast(left: number | null, right: number | null, isAscending: boolean): number {
  const isLeftMissing = left === null;
  const isRightMissing = right === null;
  if (isLeftMissing && isRightMissing) {
    return 0;
  }

  if (isLeftMissing) {
    return 1;
  }

  if (isRightMissing) {
    return -1;
  }

  if (isAscending) {
    return left - right;
  }

  return right - left;
}

export function compareListings(sortKey: ListingSortKey, direction: ListingSortDirection) {
  const isAscending = direction === "asc";

  return function compare(left: ScoredListing, right: ScoredListing): number {
    const delta = compareWithMissingLast(
      readSortNumber(left, sortKey),
      readSortNumber(right, sortKey),
      isAscending,
    );
    if (delta !== 0) {
      return delta;
    }

    return left.id.localeCompare(right.id);
  };
}

export function sortListings(
  listings: ScoredListing[],
  sortKey: ListingSortKey,
  direction: ListingSortDirection,
): ScoredListing[] {
  return listings.slice().sort(compareListings(sortKey, direction));
}

export function sortHeading(sortKey: ListingSortKey, direction: ListingSortDirection): string {
  const isAscending = direction === "asc";
  const isPrice = sortKey === "price";
  const isRating = sortKey === "rating";
  if (isPrice && isAscending) {
    return "Wszystkie, od najtańszych";
  }

  if (isPrice) {
    return "Wszystkie, od najdroższych";
  }

  if (isRating && isAscending) {
    return "Wszystkie, od najniższej oceny";
  }

  if (isRating) {
    return "Wszystkie, od najwyższej oceny";
  }

  if (isAscending) {
    return "Wszystkie, od najniższej jakości";
  }

  return "Wszystkie, od najwyższej jakości";
}
