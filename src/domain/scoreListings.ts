import { includesAny, normalizeText } from "./normalizeText";
import {
  TRAIT_BOAT,
  TRAIT_CANAL,
  TRAIT_CONDO,
  TRAIT_ISLAND,
  TRAIT_POOL,
  TRAIT_PRIVATE_BEACH,
  TRAIT_SAND,
  TRAIT_SHORE,
  TRAIT_VIEW,
} from "./traits";
import type { Listing, ScoredListing } from "../types";

const STALE_AFTER_DAYS = 540;
const DAY_IN_SECONDS = 24 * 60 * 60;
const SUITE_WORDS: Record<string, number> = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
};

interface WaterfrontScore {
  points: number;
  trait: string | null;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function listingText(listing: Listing): string {
  const parts = [
    listing.title,
    listing.description ?? "",
    listing.summary ?? "",
    (listing.features ?? []).join(" "),
  ];

  return normalizeText(parts.join(" "));
}

function waterfrontScore(text: string): WaterfrontScore {
  const isSand = includesAny(text, ["pe na areia", "na areia"]);
  if (isSand) {
    return { points: 30, trait: TRAIT_SAND };
  }

  const isShore = includesAny(text, [
    "beira mar",
    "frente mar",
    "frente para o mar",
    "frente ao mar",
    "a beira",
    "frontal mar",
  ]);
  if (isShore) {
    return { points: 26, trait: TRAIT_SHORE };
  }

  const isCoastal = text.includes("costeira");
  if (isCoastal) {
    return { points: 16, trait: TRAIT_SHORE };
  }

  const isCanal = includesAny(text, [
    "canal naveg",
    "frente para canal",
    "frente para o canal",
    "casa de canal",
    "de canal",
  ]);
  if (isCanal) {
    return { points: 14, trait: TRAIT_CANAL };
  }

  return { points: 0, trait: null };
}

function suiteCount(listing: Listing, text: string): number {
  const digitMatches = text.match(/\d+\s+suites?/g) ?? [];

  function suiteNumberFromPhrase(phrase: string): number {
    const digits = phrase.match(/\d+/);
    if (!digits) {
      return 0;
    }

    return Number(digits[0]);
  }

  const digitCounts = digitMatches.map(suiteNumberFromPhrase);
  const wordMatch = text.match(
    /\b(um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s+suites?\b/,
  );
  const counts = digitCounts.slice();
  if (wordMatch) {
    counts.push(SUITE_WORDS[wordMatch[1]] ?? 0);
  }
  if (listing.suites) {
    counts.push(listing.suites);
  }
  if (counts.length === 0) {
    return 0;
  }

  return Math.max(...counts);
}

function areaPoints(area: number | null | undefined): number {
  if (area === null || area === undefined) {
    return 0;
  }

  const isComfortable = area >= 120 && area <= 450;
  if (isComfortable) {
    return 6;
  }

  const isLarge = area > 450 && area <= 900;
  if (isLarge) {
    return 5;
  }

  const isEstate = area > 900;
  if (isEstate) {
    return 4;
  }

  return 0;
}

function boatPoints(text: string): number {
  const hasBoat = includesAny(text, [
    "vaga de barco",
    "vaga molhada",
    "vaga de iate",
    "pier",
    "poita",
    "guincho",
    "deck para",
    "vaga seca",
    "estrutura nautica",
    "iate",
    "embarcac",
    "atracac",
    "deck molhado",
    "molhada",
    "molhado",
  ]);
  if (!hasBoat) {
    return 0;
  }

  const hasWetSlip = includesAny(text, [
    "molhada",
    "molhado",
    "pier",
    "poita",
    "iate",
    "atracac",
  ]);
  if (hasWetSlip) {
    return 16;
  }

  return 12;
}

function pushTrait(traits: string[], trait: string | null): void {
  if (!trait) {
    return;
  }

  const isAlreadyListed = traits.includes(trait);
  if (isAlreadyListed) {
    return;
  }

  traits.push(trait);
}

function qualityOf(listing: Listing): { qualityScore: number; traits: string[] } {
  const text = listingText(listing);
  const waterfront = waterfrontScore(text);
  const traits: string[] = [];
  pushTrait(traits, waterfront.trait);

  let points = waterfront.points;

  const hasPrivateBeach = includesAny(text, [
    "praia privativa",
    "praias privativas",
    "praia paradisiaca privativa",
  ]);
  if (hasPrivateBeach) {
    points += 14;
    pushTrait(traits, TRAIT_PRIVATE_BEACH);
  }

  const hasView = includesAny(text, [
    "vista do mar",
    "vista para o mar",
    "vista mar",
    "vista panoramica",
    "por do sol",
    "vista privilegiada",
  ]);
  if (hasView) {
    points += 12;
    pushTrait(traits, TRAIT_VIEW);
  }

  const boat = boatPoints(text);
  if (boat > 0) {
    points += boat;
    pushTrait(traits, TRAIT_BOAT);
  }

  const hasCondo = includesAny(text, ["condominio", "cond fechado", "cond.", "porteiro"]);
  if (hasCondo) {
    points += 8;
    pushTrait(traits, TRAIT_CONDO);
  }

  const hasPool = text.includes("piscina");
  if (hasPool) {
    points += 6;
    pushTrait(traits, TRAIT_POOL);
  }

  const hasSauna = text.includes("sauna");
  if (hasSauna) {
    points += 2;
  }

  const hasIlhaGrande = text.includes("ilha grande");
  if (hasIlhaGrande) {
    points += 5;
    pushTrait(traits, TRAIT_ISLAND);
  }

  const isOtherIsland = !hasIlhaGrande && includesAny(text, ["na ilha", "ilha do"]);
  if (isOtherIsland) {
    points += 4;
    pushTrait(traits, TRAIT_ISLAND);
  }

  const suites = suiteCount(listing, text);
  points += Math.min(suites, 8) * 1.5;
  points += areaPoints(listing.area);

  return {
    qualityScore: clamp(Math.round(points), 0, 100),
    traits,
  };
}

function pricePerSquareMeter(listing: Listing): number | null {
  const hasBoth = Boolean(listing.price) && Boolean(listing.area);
  if (!hasBoth || !listing.price || !listing.area) {
    return null;
  }

  return Math.round(listing.price / listing.area);
}

function hasComparablePrice(listing: Listing): boolean {
  return listing.status === "active" && pricePerSquareMeter(listing) !== null;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = values.slice().sort(compareNumbers);
  const middle = Math.floor(sorted.length / 2);
  const isEven = sorted.length % 2 === 0;
  if (isEven) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function compareNumbers(left: number, right: number): number {
  return left - right;
}

function valueScore(pricePerMeter: number | null, medianPricePerMeter: number): number {
  const isMissing = pricePerMeter === null || medianPricePerMeter === 0;
  if (isMissing || pricePerMeter === null) {
    return 50;
  }

  const ratio = medianPricePerMeter / pricePerMeter;
  return clamp(Math.round(50 + (ratio - 1) * 40), 0, 100);
}

function discountPercent(listing: Listing): number | null {
  const hasDiscount =
    Boolean(listing.price) &&
    Boolean(listing.previousPrice) &&
    (listing.previousPrice ?? 0) > (listing.price ?? 0);
  if (!hasDiscount || !listing.price || !listing.previousPrice) {
    return null;
  }

  return Math.round((1 - listing.price / listing.previousPrice) * 100);
}

function scoreOne(listing: Listing, medianPricePerMeter: number, nowSeconds: number): ScoredListing {
  const quality = qualityOf(listing);
  const meterPrice = pricePerSquareMeter(listing);
  const value = valueScore(meterPrice, medianPricePerMeter);
  const text = listingText(listing);
  const hasDailyRate = /\bdiaria\b/.test(text);
  const isListedForSeason = text.includes("para temporada");
  const isSeasonalMention = hasDailyRate || isListedForSeason;
  const isStale = Boolean(
    listing.publishedAt && nowSeconds - listing.publishedAt > STALE_AFTER_DAYS * DAY_IN_SECONDS,
  );
  const isPriceWellAboveMedian = meterPrice !== null && meterPrice > medianPricePerMeter * 2;

  return {
    ...listing,
    qualityScore: quality.qualityScore,
    valueScore: value,
    rating: Math.round(quality.qualityScore * 0.75 + value * 0.25),
    pricePerSquareMeter: meterPrice,
    discountPercent: discountPercent(listing),
    traits: quality.traits,
    isSeasonalMention,
    isStale,
    isPriceWellAboveMedian,
  };
}

export function scoreListings(listings: Listing[], nowSeconds: number): ScoredListing[] {
  const comparable = listings.filter(hasComparablePrice);
  function readMeterPrice(listing: Listing): number {
    return pricePerSquareMeter(listing) ?? 0;
  }
  const medianPricePerMeter = median(comparable.map(readMeterPrice));

  function applyScore(listing: Listing): ScoredListing {
    return scoreOne(listing, medianPricePerMeter, nowSeconds);
  }

  return listings.map(applyScore);
}

export function medianPricePerSquareMeter(listings: ScoredListing[]): number {
  function readPrice(listing: ScoredListing): number {
    return listing.pricePerSquareMeter ?? 0;
  }

  function hasMeterPrice(listing: ScoredListing): boolean {
    return listing.status === "active" && listing.pricePerSquareMeter !== null;
  }

  return Math.round(median(listings.filter(hasMeterPrice).map(readPrice)));
}

export function compareByPrice(left: ScoredListing, right: ScoredListing): number {
  return (left.price ?? Number.MAX_SAFE_INTEGER) - (right.price ?? Number.MAX_SAFE_INTEGER);
}

export function compareByQuality(left: ScoredListing, right: ScoredListing): number {
  const qualityDelta = right.qualityScore - left.qualityScore;
  if (qualityDelta !== 0) {
    return qualityDelta;
  }

  return (left.price ?? 0) - (right.price ?? 0);
}
