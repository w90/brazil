import { normalizeText } from "./normalizeText";
import { compareByPrice, compareByQuality } from "./scoreListings";
import type { ListingFilters, ScoredListing } from "../types";

export function isActiveListing(listing: ScoredListing): boolean {
  return listing.status === "active";
}

export function isRemovedListing(listing: ScoredListing): boolean {
  return listing.status === "removed";
}

export function selectPricedListings(listings: ScoredListing[]): ScoredListing[] {
  return listings.filter(isActiveListing).slice().sort(compareByPrice);
}

export function selectTopListings(listings: ScoredListing[], limit: number): ScoredListing[] {
  return listings.filter(isActiveListing).slice().sort(compareByQuality).slice(0, limit);
}

export function matchesFilters(listing: ScoredListing, filters: ListingFilters): boolean {
  const isAllNeighborhoods = filters.neighborhood === "all";
  const isNeighborhoodMatch = isAllNeighborhoods || listing.neighborhood === filters.neighborhood;
  if (!isNeighborhoodMatch) {
    return false;
  }

  const isAllTraits = filters.trait === "all";
  const isTraitMatch = isAllTraits || listing.traits.includes(filters.trait);
  if (!isTraitMatch) {
    return false;
  }

  const query = normalizeText(filters.query);
  const isQueryEmpty = query.length === 0;
  if (isQueryEmpty) {
    return true;
  }

  const haystack = normalizeText(
    [listing.title, listing.seller ?? "", listing.neighborhood ?? "", listing.description ?? ""].join(" "),
  );

  return haystack.includes(query);
}

export function filterListings(listings: ScoredListing[], filters: ListingFilters): ScoredListing[] {
  function matchesCurrentFilters(listing: ScoredListing): boolean {
    return matchesFilters(listing, filters);
  }

  return listings.filter(matchesCurrentFilters);
}

export function neighborhoodOptions(listings: ScoredListing[]): string[] {
  function readNeighborhood(listing: ScoredListing): string {
    return listing.neighborhood ?? "";
  }

  function hasNeighborhood(name: string): boolean {
    return name.length > 0;
  }

  return [...new Set(listings.filter(isActiveListing).map(readNeighborhood).filter(hasNeighborhood))].sort(
    compareLabels,
  );
}

function compareLabels(left: string, right: string): number {
  return left.localeCompare(right, "pl");
}
