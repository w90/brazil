import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isValidStarCount,
  starRatingKey,
  type StarRatingRow,
  type StarRatingsByKey,
} from "./listingStarRatings";

export interface StarRatingRemoteRow {
  listing_id: string;
  user_id: string;
  stars: number;
}

export interface RemoteStarRatingChange {
  eventType: string;
  new: unknown;
  old: { listing_id?: string; user_id?: string };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object";
  const isNotNull = value !== null;
  return isObject && isNotNull;
}

function readRemoteRow(value: unknown): StarRatingRow | null {
  const isRow = isRecord(value);
  if (!isRow) {
    return null;
  }

  const listingId = value.listing_id;
  const userId = value.user_id;
  const stars = value.stars;
  const hasListingId = typeof listingId === "string" && listingId.length > 0;
  const hasUserId = typeof userId === "string" && userId.length >= 8 && userId.length <= 80;
  const hasStars = typeof stars === "number" && isValidStarCount(stars);
  const isValid = hasListingId && hasUserId && hasStars;
  if (!isValid || typeof listingId !== "string" || typeof userId !== "string" || typeof stars !== "number") {
    return null;
  }

  return {
    listingId,
    userId,
    stars,
  };
}

function ratingsFromRows(value: unknown): StarRatingsByKey {
  const isArray = Array.isArray(value);
  if (!isArray) {
    return {};
  }

  const ratings: StarRatingsByKey = {};
  for (const item of value) {
    const row = readRemoteRow(item);
    if (!row) {
      continue;
    }

    ratings[starRatingKey(row.listingId, row.userId)] = row;
  }

  return ratings;
}

export function readChangedStarRating(payload: RemoteStarRatingChange): StarRatingRow | null {
  const isDelete = payload.eventType === "DELETE";
  if (isDelete) {
    const listingId = payload.old.listing_id;
    const userId = payload.old.user_id;
    const hasListingId = typeof listingId === "string" && listingId.length > 0;
    const hasUserId = typeof userId === "string" && userId.length > 0;
    const hasKey = hasListingId && hasUserId;
    if (!hasKey || !listingId || !userId) {
      return null;
    }

    return {
      listingId,
      userId,
      stars: 0,
    };
  }

  return readRemoteRow(payload.new);
}

export function applyRemoteStarRatingChange(
  current: StarRatingsByKey,
  payload: RemoteStarRatingChange,
  pendingKeys: Set<string>,
): StarRatingsByKey {
  const row = readChangedStarRating(payload);
  if (!row) {
    return current;
  }

  const key = starRatingKey(row.listingId, row.userId);
  const isPending = pendingKeys.has(key);
  if (isPending) {
    return current;
  }

  const nextRatings = { ...current };
  const isDelete = payload.eventType === "DELETE";
  if (isDelete) {
    delete nextRatings[key];
    return nextRatings;
  }

  nextRatings[key] = row;
  return nextRatings;
}

export async function fetchListingStarRatings(client: SupabaseClient): Promise<StarRatingsByKey> {
  const { data, error } = await client.from("listing_star_ratings").select("listing_id, user_id, stars");
  if (error) {
    throw error;
  }

  return ratingsFromRows(data);
}

export function toStarRatingRemoteRow(row: StarRatingRow): StarRatingRemoteRow {
  return {
    listing_id: row.listingId,
    user_id: row.userId,
    stars: row.stars,
  };
}

export async function uploadListingStarRatings(client: SupabaseClient, rows: StarRatingRow[]): Promise<void> {
  const hasRows = rows.length > 0;
  if (!hasRows) {
    return;
  }

  const remoteRows = rows.map(toStarRatingRemoteRow);
  const { error } = await client.from("listing_star_ratings").upsert(remoteRows);
  if (error) {
    throw error;
  }
}

export async function persistRemoteStarRating(
  client: SupabaseClient,
  row: StarRatingRow | null,
  listingId: string,
  userId: string,
): Promise<void> {
  const hasRating = row !== null;
  if (!hasRating) {
    const { error } = await client
      .from("listing_star_ratings")
      .delete()
      .eq("listing_id", listingId)
      .eq("user_id", userId);
    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await client.from("listing_star_ratings").upsert(toStarRatingRemoteRow(row));
  if (error) {
    throw error;
  }
}
