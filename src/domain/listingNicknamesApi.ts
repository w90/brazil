import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingNicknamesById } from "./listingNicknames";

interface ListingNicknameRow {
  listing_id: string;
  nickname: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object";
  const isNotNull = value !== null;
  return isObject && isNotNull;
}

function readNickname(value: unknown): string {
  const isText = typeof value === "string";
  if (!isText) {
    return "";
  }

  return value.trim().slice(0, 80);
}

export function nicknamesFromRows(value: unknown): ListingNicknamesById {
  const isArray = Array.isArray(value);
  if (!isArray) {
    return {};
  }

  const nicknames: ListingNicknamesById = {};

  for (const row of value) {
    const isRow = isRecord(row);
    if (!isRow || typeof row.listing_id !== "string") {
      continue;
    }

    const nickname = readNickname(row.nickname);
    const hasNickname = nickname.length > 0;
    if (!hasNickname) {
      continue;
    }

    nicknames[row.listing_id] = nickname;
  }

  return nicknames;
}

export async function fetchListingNicknames(client: SupabaseClient): Promise<ListingNicknamesById> {
  const { data, error } = await client.from("listing_nicknames").select("listing_id, nickname");
  if (error) {
    throw error;
  }

  return nicknamesFromRows(data);
}

export async function uploadMissingNicknames(
  client: SupabaseClient,
  resolvedNicknames: ListingNicknamesById,
  remoteNicknames: ListingNicknamesById,
): Promise<void> {
  const rows: ListingNicknameRow[] = [];

  for (const listingId of Object.keys(resolvedNicknames)) {
    const nickname = readNickname(resolvedNicknames[listingId]);
    const hasNickname = nickname.length > 0;
    const isAlreadyStored = remoteNicknames[listingId] === nickname;
    if (!hasNickname || isAlreadyStored) {
      continue;
    }

    rows.push({ listing_id: listingId, nickname });
  }

  const hasRows = rows.length > 0;
  if (!hasRows) {
    return;
  }

  const { error } = await client.from("listing_nicknames").upsert(rows);
  if (error) {
    throw error;
  }
}
