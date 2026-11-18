import type { Listing } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object";
  const isNotNull = value !== null;
  return isObject && isNotNull;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function htmlToText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseBrl(value: unknown): number | null {
  const isNumber = typeof value === "number" && Number.isFinite(value);
  if (isNumber) {
    return value;
  }

  const isText = typeof value === "string";
  if (!isText) {
    return null;
  }

  const trimmed = value.trim();
  const isUnknown = /n[aã]o informado/i.test(trimmed);
  const isEmpty = trimmed.length === 0;
  if (isUnknown || isEmpty) {
    return null;
  }

  const withoutCurrency = trimmed.replace(/[^\d,.-]/g, "");
  const hasComma = withoutCurrency.includes(",");
  const normalized = hasComma
    ? withoutCurrency.replace(/\./g, "").replace(",", ".")
    : withoutCurrency.replace(/\./g, "");
  const amount = Number(normalized);
  const isAmount = Number.isFinite(amount);
  if (!isAmount) {
    return null;
  }

  return amount;
}

function readInteger(value: string): number | null {
  const match = value.match(/\d+/);
  if (!match) {
    return null;
  }

  return Number(match[0]);
}

function readProperty(properties: unknown, name: string): string {
  const isList = Array.isArray(properties);
  if (!isList) {
    return "";
  }

  for (const item of properties) {
    const isItem = isRecord(item);
    if (!isItem) {
      continue;
    }

    const isName = item.name === name;
    if (!isName || typeof item.value !== "string") {
      continue;
    }

    return item.value;
  }

  return "";
}

function readPriceInfo(items: unknown, name: string): number | null {
  const isList = Array.isArray(items);
  if (!isList) {
    return null;
  }

  for (const item of items) {
    const isItem = isRecord(item);
    if (!isItem) {
      continue;
    }

    const isName = item.name === name;
    if (!isName) {
      continue;
    }

    return parseBrl(item.value);
  }

  return null;
}

function formatZip(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const isCep = digits.length === 8;
  if (!isCep) {
    return value.length > 0 ? value : null;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function titleFromSlug(value: string): string {
  const words = value.split("-").filter(function hasWord(word) {
    return word.length > 0;
  });

  return words
    .map(function capitalize(word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatMaskedPhone(masked: string): string {
  const compact = masked.replace(/\s/g, "");
  const hasMask = compact.length > 2;
  if (!hasMask) {
    return masked.trim();
  }

  const ddd = compact.slice(0, 2);
  const rest = compact.slice(2).replace("*", "-*");
  return `(${ddd}) ${rest}`;
}

function readPhone(value: unknown): string {
  const isPhone = isRecord(value);
  if (!isPhone) {
    return "";
  }

  const fullNumber = typeof value.phone === "string" ? value.phone.trim() : "";
  const hasFullNumber = fullNumber.length > 0;
  if (hasFullNumber) {
    return fullNumber;
  }

  const masked = typeof value.maskedPhone === "string" ? value.maskedPhone : "";
  return formatMaskedPhone(masked);
}

function readProfile(user: unknown): string {
  const isUser = isRecord(user);
  if (!isUser) {
    return "";
  }

  const name = typeof user.name === "string" ? user.name : "";
  const accountId = typeof user.publicAccountId === "string" ? user.publicAccountId : "";
  const hasProfile = name.length > 0 && accountId.length >= 8;
  if (!hasProfile) {
    return "";
  }

  return `https://www.olx.com.br/perfil/${slugify(name)}-${accountId.slice(0, 8)}`;
}

function readSummary(featuresSummary: unknown): string {
  const isList = Array.isArray(featuresSummary);
  if (!isList) {
    return "";
  }

  const parts: string[] = [];

  for (const item of featuresSummary) {
    const isItem = isRecord(item);
    if (!isItem || typeof item.value !== "string") {
      continue;
    }

    const isSize = item.name === "size";
    if (isSize) {
      parts.push(item.value);
      continue;
    }

    const label = typeof item.label === "string" ? item.label : "";
    const hasLabel = label.length > 0;
    if (hasLabel) {
      parts.push(`${item.value} ${label}`);
    }
  }

  return parts.join("• ");
}

function readFeatures(properties: unknown): string[] {
  const featureText = [readProperty(properties, "re_features"), readProperty(properties, "re_complex_features")]
    .join(", ");
  const parts = featureText.split(",");
  const features: string[] = [];

  for (const part of parts) {
    const feature = part.trim();
    const isNew = feature.length > 0 && !features.includes(feature);
    if (isNew) {
      features.push(feature);
    }
  }

  return features;
}

function readSuites(properties: unknown, description: string): number | null {
  const fromProperty = readInteger(readProperty(properties, "suites"));
  if (fromProperty !== null) {
    return fromProperty;
  }

  const match = description.match(/(\d+)\s*su[ií]tes?/i);
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function readPublishedAt(ad: Record<string, unknown>): number | null {
  const original = ad.origListTime;
  const isUnix = typeof original === "number" && original > 1_000_000_000;
  if (isUnix) {
    return original;
  }

  const listTime = ad.listTime;
  const isIso = typeof listTime === "string";
  if (!isIso) {
    return null;
  }

  const parsed = Date.parse(listTime);
  const isParsed = Number.isFinite(parsed);
  if (!isParsed) {
    return null;
  }

  return Math.floor(parsed / 1000);
}

function readInitialAd(html: string): Record<string, unknown> | null {
  const match = html.match(/<script id="initial-data"[^>]*data-json="([^"]*)"/);
  if (!match) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(decodeHtml(match[1]));
    const isPayload = isRecord(parsed);
    if (!isPayload || !isRecord(parsed.ad)) {
      return null;
    }

    return parsed.ad;
  } catch {
    return null;
  }
}

export function parseOlxListing(html: string, pageUrl: string): Listing | null {
  const ad = readInitialAd(html);
  if (!ad) {
    return null;
  }

  const listId = ad.listId;
  const hasId = typeof listId === "number" || typeof listId === "string";
  const title = typeof ad.subject === "string" ? ad.subject.trim() : "";
  const hasTitle = title.length > 0;
  if (!hasId || !hasTitle) {
    return null;
  }

  const location = isRecord(ad.location) ? ad.location : {};
  const user = isRecord(ad.user) ? ad.user : {};
  const description = htmlToText(typeof ad.description === "string" ? ad.description : "");
  const price = parseBrl(ad.priceValue ?? ad.price);
  const previousPrice = parseBrl(ad.oldPrice);
  const isSamePrice = previousPrice !== null && previousPrice === price;
  const images = Array.isArray(ad.images) ? ad.images : [];
  const firstImage = isRecord(images[0]) ? images[0] : null;
  const image = firstImage && typeof firstImage.original === "string" ? firstImage.original : null;
  const zone = typeof location.zone === "string" ? location.zone : "";
  const friendlyUrl = typeof ad.friendlyUrl === "string" ? ad.friendlyUrl : pageUrl;
  const seller = typeof user.name === "string" ? user.name : "";
  const zip = typeof location.zipcode === "string" ? formatZip(location.zipcode) : null;
  const latitude = typeof location.mapLati === "number" ? location.mapLati : null;
  const longitude = typeof location.mapLong === "number" ? location.mapLong : null;

  return {
    id: String(listId),
    url: friendlyUrl,
    status: "active",
    title,
    price,
    previousPrice: isSamePrice ? null : previousPrice,
    condoFee: readPriceInfo(ad.realEstatePriceInfo, "condominio"),
    neighborhood: typeof location.neighbourhood === "string" ? location.neighbourhood : "",
    city: typeof location.municipality === "string" ? location.municipality : "",
    region: zone.length > 0 ? titleFromSlug(zone) : "",
    zip,
    latitude,
    longitude,
    area: readInteger(readProperty(ad.properties, "size")),
    bedrooms: readInteger(readProperty(ad.properties, "rooms")),
    bathrooms: readProperty(ad.properties, "bathrooms") || null,
    parking: readInteger(readProperty(ad.properties, "garage_spaces")),
    suites: readSuites(ad.properties, description),
    summary: readSummary(ad.featuresSummary),
    features: readFeatures(ad.properties),
    description,
    image,
    imageCount: images.length,
    seller,
    isProfessional: ad.professionalAd === true,
    profile: readProfile(user),
    phone: readPhone(ad.phone),
    publishedAt: readPublishedAt(ad),
  };
}
