const ratingsStorageKey = "brazil.star-ratings";
const raterStorageKey = "brazil.rater-id";

const averageFormatter = new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export interface StarRatingRow {
  listingId: string;
  userId: string;
  stars: number;
}

export type StarRatingsByKey = Record<string, StarRatingRow>;

export interface StarRatingView {
  ownStars: number | null;
  count: number;
  average: number | null;
}

export function starRatingKey(listingId: string, userId: string): string {
  return `${listingId}::${userId}`;
}

export function isValidStarCount(stars: number): boolean {
  const isInteger = Number.isInteger(stars);
  const isInRange = stars >= 1 && stars <= 5;
  return isInteger && isInRange;
}

function createRaterId(): string {
  const hasRandomUuid = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function";
  if (hasRandomUuid) {
    return crypto.randomUUID();
  }

  return `rater-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export function readRaterId(): string {
  try {
    const savedId = window.localStorage.getItem(raterStorageKey);
    const hasSavedId = typeof savedId === "string" && savedId.length >= 3 && savedId.length <= 80;
    if (hasSavedId && savedId) {
      return savedId;
    }

    const nextId = createRaterId();
    window.localStorage.setItem(raterStorageKey, nextId);
    return nextId;
  } catch {
    return createRaterId();
  }
}

function readStoredRow(value: unknown): StarRatingRow | null {
  const isObject = typeof value === "object";
  const isNotNull = value !== null;
  if (!isObject || !isNotNull) {
    return null;
  }

  const row = value as StarRatingRow;
  const hasListingId = typeof row.listingId === "string" && row.listingId.length > 0;
  const hasUserId = typeof row.userId === "string" && row.userId.length >= 3 && row.userId.length <= 80;
  const hasStars = typeof row.stars === "number" && isValidStarCount(row.stars);
  const isValid = hasListingId && hasUserId && hasStars;
  if (!isValid) {
    return null;
  }

  return {
    listingId: row.listingId,
    userId: row.userId,
    stars: row.stars,
  };
}

export function loadStoredStarRatings(): StarRatingsByKey {
  try {
    const savedRatings = window.localStorage.getItem(ratingsStorageKey);
    if (!savedRatings) {
      return {};
    }

    const parsed: unknown = JSON.parse(savedRatings);
    const isArray = Array.isArray(parsed);
    if (!isArray) {
      return {};
    }

    const ratings: StarRatingsByKey = {};
    for (const item of parsed) {
      const row = readStoredRow(item);
      if (!row) {
        continue;
      }

      ratings[starRatingKey(row.listingId, row.userId)] = row;
    }

    return ratings;
  } catch {
    return {};
  }
}

export function saveStoredStarRatings(ratings: StarRatingsByKey): void {
  try {
    window.localStorage.setItem(ratingsStorageKey, JSON.stringify(Object.values(ratings)));
  } catch {
    return;
  }
}

export function summarizeStarRating(
  ratings: StarRatingsByKey,
  listingId: string,
  userId: string,
): StarRatingView {
  const rows = Object.values(ratings);
  let count = 0;
  let total = 0;
  let ownStars: number | null = null;

  for (const row of rows) {
    const isSameListing = row.listingId === listingId;
    if (!isSameListing) {
      continue;
    }

    count += 1;
    total += row.stars;
    const isOwnRating = row.userId === userId;
    if (isOwnRating) {
      ownStars = row.stars;
    }
  }

  const hasRatings = count > 0;
  if (!hasRatings) {
    return {
      ownStars: null,
      count: 0,
      average: null,
    };
  }

  return {
    ownStars,
    count,
    average: total / count,
  };
}

function ratingCountLabel(count: number): string {
  const remainder100 = count % 100;
  const isTeen = remainder100 >= 12 && remainder100 <= 14;
  if (isTeen) {
    return `${count} ocen`;
  }

  const remainder10 = count % 10;
  const isSingle = remainder10 === 1;
  if (isSingle) {
    return `${count} ocena`;
  }

  const isFew = remainder10 >= 2 && remainder10 <= 4;
  if (isFew) {
    return `${count} oceny`;
  }

  return `${count} ocen`;
}

export function formatStarRatingSummary(view: StarRatingView): string {
  const hasRatings = view.count > 0 && view.average !== null;
  if (!hasRatings || view.average === null) {
    return "Brak ocen";
  }

  return `${ratingCountLabel(view.count)} · średnia ${averageFormatter.format(view.average)}`;
}

export function upsertStarRating(
  ratings: StarRatingsByKey,
  row: StarRatingRow,
): StarRatingsByKey {
  return {
    ...ratings,
    [starRatingKey(row.listingId, row.userId)]: row,
  };
}

export function omitStarRating(
  ratings: StarRatingsByKey,
  listingId: string,
  userId: string,
): StarRatingsByKey {
  const nextRatings = { ...ratings };
  delete nextRatings[starRatingKey(listingId, userId)];
  return nextRatings;
}

export function mergeLoadedStarRatings(
  remoteRatings: StarRatingsByKey,
  localRatings: StarRatingsByKey,
  userId: string,
  pendingKeys: Set<string>,
): { ratings: StarRatingsByKey; ownRows: StarRatingRow[] } {
  const ratings: StarRatingsByKey = { ...remoteRatings };
  const ownRows: StarRatingRow[] = [];

  for (const row of Object.values(localRatings)) {
    const isOwnRating = row.userId === userId;
    if (!isOwnRating) {
      continue;
    }

    const key = starRatingKey(row.listingId, row.userId);
    const isPending = pendingKeys.has(key);
    if (isPending) {
      continue;
    }

    const remoteRow = remoteRatings[key];
    const isSame = remoteRow !== undefined && remoteRow.stars === row.stars;
    if (isSame) {
      continue;
    }

    ratings[key] = row;
    ownRows.push(row);
  }

  for (const key of pendingKeys) {
    const pendingRow = localRatings[key];
    const hasPendingRow = pendingRow !== undefined;
    if (hasPendingRow) {
      ratings[key] = pendingRow;
      continue;
    }

    delete ratings[key];
  }

  return {
    ratings,
    ownRows,
  };
}
