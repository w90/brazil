import { compareByPrice } from "./scoreListings";
import type { ScoredListing } from "../types";

const PIN_SPACING_PIXELS = 30;
const PIXELS_PER_DEGREE_AT_NEIGHBORHOOD_ZOOM = (256 * 2 ** 16) / 360;

export interface MapPoint {
  listing: ScoredListing;
  latitude: number;
  longitude: number;
  isSharedPoint: boolean;
}

export interface MapGroup {
  latitude: number;
  longitude: number;
  points: MapPoint[];
}

function hasCoordinates(listing: ScoredListing): boolean {
  const hasLatitude = typeof listing.latitude === "number";
  const hasLongitude = typeof listing.longitude === "number";
  return hasLatitude && hasLongitude;
}

function readPointKey(listing: ScoredListing): string {
  return `${listing.latitude}|${listing.longitude}`;
}

function spreadRadiusDegrees(count: number): number {
  const radiusPixels = (PIN_SPACING_PIXELS * count) / (2 * Math.PI);
  return radiusPixels / PIXELS_PER_DEGREE_AT_NEIGHBORHOOD_ZOOM;
}

export function sharedCircleRadiusMeters(count: number): number {
  return spreadRadiusDegrees(count) * 111_320 + 40;
}

function placeGroup(group: ScoredListing[]): MapGroup {
  const ordered = group.slice().sort(compareByPrice);
  const originLatitude = ordered[0].latitude as number;
  const originLongitude = ordered[0].longitude as number;
  const isSharedPoint = ordered.length > 1;

  if (!isSharedPoint) {
    return {
      latitude: originLatitude,
      longitude: originLongitude,
      points: [
        {
          listing: ordered[0],
          latitude: originLatitude,
          longitude: originLongitude,
          isSharedPoint: false,
        },
      ],
    };
  }

  const radiusDegrees = spreadRadiusDegrees(ordered.length);
  const step = (Math.PI * 2) / ordered.length;
  const longitudeScale = Math.cos((originLatitude * Math.PI) / 180);

  function placeListing(listing: ScoredListing, index: number): MapPoint {
    const angle = step * index;
    return {
      listing,
      latitude: originLatitude + radiusDegrees * Math.sin(angle),
      longitude: originLongitude + (radiusDegrees * Math.cos(angle)) / longitudeScale,
      isSharedPoint: true,
    };
  }

  return {
    latitude: originLatitude,
    longitude: originLongitude,
    points: ordered.map(placeListing),
  };
}

export function buildMapGroups(listings: ScoredListing[]): MapGroup[] {
  const located = listings.filter(hasCoordinates);
  const buckets = new Map<string, ScoredListing[]>();

  function addListing(listing: ScoredListing) {
    const key = readPointKey(listing);
    const bucket = buckets.get(key) ?? [];
    bucket.push(listing);
    buckets.set(key, bucket);
  }

  located.forEach(addListing);
  return Array.from(buckets.values(), placeGroup);
}

export function countSharedPins(groups: MapGroup[]): number {
  function readSharedCount(group: MapGroup): number {
    const isSharedGroup = group.points.length > 1;
    if (!isSharedGroup) {
      return 0;
    }
    return group.points.length;
  }

  return groups.reduce(function sumShared(total, group) {
    return total + readSharedCount(group);
  }, 0);
}
