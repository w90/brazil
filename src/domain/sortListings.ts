import type { ListingNotesById } from "./listingNotes";
import type { ListingSortDirection, ListingSortKey, ScoredListing } from "../types";

function readSellerName(listing: ScoredListing): string {
  return (listing.seller ?? "").trim();
}

function compareSellerNames(left: string, right: string, isAscending: boolean): number {
  const isLeftMissing = left.length === 0;
  const isRightMissing = right.length === 0;
  if (isLeftMissing && isRightMissing) {
    return 0;
  }

  if (isLeftMissing) {
    return 1;
  }

  if (isRightMissing) {
    return -1;
  }

  const delta = left.localeCompare(right, "pl", { sensitivity: "base" });
  if (isAscending) {
    return delta;
  }

  return -delta;
}

function isNoteSort(sortKey: ListingSortKey): boolean {
  const isHighlighted = sortKey === "highlighted";
  const isContacted = sortKey === "contacted";
  const isComment = sortKey === "comment";
  return isHighlighted || isContacted || isComment;
}

function readNoteFlag(listing: ScoredListing, notesById: ListingNotesById, sortKey: ListingSortKey): number {
  const note = notesById[listing.id];
  const isHighlighted = sortKey === "highlighted";
  if (isHighlighted) {
    return note?.isHighlighted ? 1 : 0;
  }

  const isContacted = sortKey === "contacted";
  if (isContacted) {
    return note?.isContacted ? 1 : 0;
  }

  const hasComment = (note?.comment.trim().length ?? 0) > 0;
  return hasComment ? 1 : 0;
}

function readSortNumber(listing: ScoredListing, sortKey: ListingSortKey): number | null {
  const isSortingByNote = isNoteSort(sortKey);
  if (isSortingByNote) {
    return null;
  }

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

export function compareListings(
  sortKey: ListingSortKey,
  direction: ListingSortDirection,
  notesById: ListingNotesById,
) {
  const isAscending = direction === "asc";

  return function compare(left: ScoredListing, right: ScoredListing): number {
    const isSellerSort = sortKey === "seller";
    if (isSellerSort) {
      const sellerDelta = compareSellerNames(readSellerName(left), readSellerName(right), isAscending);
      if (sellerDelta !== 0) {
        return sellerDelta;
      }

      return left.id.localeCompare(right.id);
    }

    const isSortingByNote = isNoteSort(sortKey);
    if (isSortingByNote) {
      const noteDelta = compareWithMissingLast(
        readNoteFlag(left, notesById, sortKey),
        readNoteFlag(right, notesById, sortKey),
        isAscending,
      );
      if (noteDelta !== 0) {
        return noteDelta;
      }

      return left.id.localeCompare(right.id);
    }

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
  notesById: ListingNotesById,
): ScoredListing[] {
  return listings.slice().sort(compareListings(sortKey, direction, notesById));
}

export function sortHeading(sortKey: ListingSortKey, direction: ListingSortDirection): string {
  const isAscending = direction === "asc";
  const isPrice = sortKey === "price";
  const isRating = sortKey === "rating";
  if (isPrice && isAscending) {
    return "Pozostałe, od najtańszych";
  }

  if (isPrice) {
    return "Pozostałe, od najdroższych";
  }

  if (isRating && isAscending) {
    return "Pozostałe, od najniższej oceny";
  }

  if (isRating) {
    return "Pozostałe, od najwyższej oceny";
  }

  const isSeller = sortKey === "seller";
  if (isSeller && isAscending) {
    return "Pozostałe, według agencji A–Z";
  }

  if (isSeller) {
    return "Pozostałe, według agencji Z–A";
  }

  const isHighlighted = sortKey === "highlighted";
  if (isHighlighted && isAscending) {
    return "Pozostałe, najpierw bez wyróżnienia";
  }

  if (isHighlighted) {
    return "Pozostałe, najpierw wyróżnione";
  }

  const isContacted = sortKey === "contacted";
  if (isContacted && isAscending) {
    return "Pozostałe, najpierw bez kontaktu";
  }

  if (isContacted) {
    return "Pozostałe, najpierw skontaktowane";
  }

  const isComment = sortKey === "comment";
  if (isComment && isAscending) {
    return "Pozostałe, najpierw bez komentarza";
  }

  if (isComment) {
    return "Pozostałe, najpierw z komentarzem";
  }

  if (isAscending) {
    return "Pozostałe, od najniższej jakości";
  }

  return "Pozostałe, od najwyższej jakości";
}
