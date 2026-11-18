import { findAgencyContact } from "./agencyPhones";
import type { Listing } from "../types";

export function agencyPhoneKey(listing: Pick<Listing, "id" | "seller">): string {
  const seller = listing.seller?.trim() ?? "";
  const hasSeller = seller.length > 0;
  if (hasSeller) {
    return seller;
  }

  return `listing:${listing.id}`;
}

export function splitPhoneText(value: string): string[] {
  const parts = value.split(/[\n,;]+/);
  const phones: string[] = [];

  for (const part of parts) {
    const phone = part.trim();
    const isNew = phone.length > 0 && !phones.includes(phone);
    if (isNew) {
      phones.push(phone);
    }
  }

  return phones;
}

export function resolveAgencyPhones(
  listing: Pick<Listing, "id" | "seller" | "phone">,
  phoneTextBySeller: Record<string, string>,
): string[] {
  const key = agencyPhoneKey(listing);
  const hasOverride = Object.prototype.hasOwnProperty.call(phoneTextBySeller, key);
  if (hasOverride) {
    return splitPhoneText(phoneTextBySeller[key] ?? "");
  }

  const contact = findAgencyContact(listing.seller);
  if (contact) {
    return contact.phones;
  }

  const olxPhone = listing.phone ?? "";
  const hasOlxPhone = olxPhone.length > 0;
  if (hasOlxPhone) {
    return [olxPhone];
  }

  return [];
}

export function phoneDraftForListing(
  listing: Pick<Listing, "id" | "seller" | "phone">,
  phoneTextBySeller: Record<string, string>,
): string {
  const key = agencyPhoneKey(listing);
  const hasOverride = Object.prototype.hasOwnProperty.call(phoneTextBySeller, key);
  if (hasOverride) {
    return phoneTextBySeller[key] ?? "";
  }

  return resolveAgencyPhones(listing, {}).join(", ");
}
