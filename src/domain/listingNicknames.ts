import fixedListingNicknames from "../data/listingNicknames.json";
import { animalNames, isKnownAnimalName } from "./animalNames";

const storageKey = "brazil.listing-nicknames";

export type ListingNicknamesById = Record<string, string>;

const fixedNicknames = fixedListingNicknames as ListingNicknamesById;

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object";
  const isNotNull = value !== null;
  return isObject && isNotNull;
}

function compareIds(left: string, right: string): number {
  return left.localeCompare(right);
}

function isKeepableNickname(value: string | undefined, usedNames: Set<string>): value is string {
  const hasText = typeof value === "string" && value.trim().length > 0;
  const isFree = hasText && !usedNames.has(value.trim());
  return isFree;
}

function hashListingId(listingId: string): number {
  let hash = 2166136261;

  for (let index = 0; index < listingId.length; index += 1) {
    hash ^= listingId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function pickUnusedName(listingId: string, usedNames: Set<string>): string {
  const available = animalNames.filter(function isFree(name) {
    return !usedNames.has(name);
  });
  const hasAvailable = available.length > 0;
  if (!hasAvailable) {
    return `Zwierzę ${usedNames.size + 1}`;
  }

  const index = hashListingId(listingId) % available.length;
  return available[index];
}

export function loadStoredNicknames(): ListingNicknamesById {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    const isMap = isRecord(parsed);
    if (!isMap) {
      return {};
    }

    const nicknames: ListingNicknamesById = {};

    for (const listingId of Object.keys(parsed)) {
      const value = parsed[listingId];
      const isNickname = typeof value === "string" && value.trim().length > 0;
      if (!isNickname || typeof value !== "string") {
        continue;
      }

      nicknames[listingId] = value.trim();
    }

    return nicknames;
  } catch {
    return {};
  }
}

export function saveStoredNicknames(nicknames: ListingNicknamesById): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(nicknames));
  } catch {
    return;
  }
}

export function resolveListingNicknames(
  listingIds: string[],
  storedNicknames: ListingNicknamesById,
): ListingNicknamesById {
  const nicknames: ListingNicknamesById = {};
  const usedNames = new Set<string>();
  const orderedIds = listingIds.slice().sort(compareIds);
  const missingIds: string[] = [];

  for (const listingId of orderedIds) {
    const storedName = storedNicknames[listingId]?.trim();
    const canKeepStoredName = isKeepableNickname(storedName, usedNames);
    if (!canKeepStoredName) {
      missingIds.push(listingId);
      continue;
    }

    nicknames[listingId] = storedName;
    usedNames.add(storedName);
  }

  const unassignedIds: string[] = [];

  for (const listingId of missingIds) {
    const fixedName = fixedNicknames[listingId];
    const canUseFixedName = isKnownAnimalName(fixedName) && !usedNames.has(fixedName);
    if (!canUseFixedName) {
      unassignedIds.push(listingId);
      continue;
    }

    nicknames[listingId] = fixedName;
    usedNames.add(fixedName);
  }

  unassignedIds.sort(compareIds);

  for (const listingId of unassignedIds) {
    const nickname = pickUnusedName(listingId, usedNames);
    nicknames[listingId] = nickname;
    usedNames.add(nickname);
  }

  return nicknames;
}

export function collectExtraNicknames(
  resolvedNicknames: ListingNicknamesById,
  storedNicknames: ListingNicknamesById,
): ListingNicknamesById {
  const extras: ListingNicknamesById = {};

  for (const listingId of Object.keys(storedNicknames)) {
    const storedName = storedNicknames[listingId];
    const fixedName = fixedNicknames[listingId];
    const isFixedName = fixedName === storedName;
    const hasStoredName = storedName.length > 0;
    if (!hasStoredName || isFixedName) {
      continue;
    }

    extras[listingId] = storedName;
  }

  for (const listingId of Object.keys(resolvedNicknames)) {
    const nickname = resolvedNicknames[listingId];
    const fixedName = fixedNicknames[listingId];
    const isFixedName = fixedName === nickname;
    if (isFixedName) {
      continue;
    }

    extras[listingId] = nickname;
  }

  return extras;
}

export function nicknameSignature(nicknames: ListingNicknamesById): string {
  const listingIds = Object.keys(nicknames).sort(compareIds);

  return listingIds
    .map(function formatPair(listingId) {
      return `${listingId}=${nicknames[listingId]}`;
    })
    .join("\n");
}
