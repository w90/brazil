import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getListingNotesClient } from "../domain/supabaseClient";
import { authorNameField } from "../domain/visitorName";
import type { Listing } from "../types";

const storageKey = "brazil.custom-listings";

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object";
  const isNotNull = value !== null;
  return isObject && isNotNull;
}

function isListing(value: unknown): value is Listing {
  const isItem = isRecord(value);
  if (!isItem) {
    return false;
  }

  const hasId = typeof value.id === "string" && value.id.length > 0;
  const hasUrl = typeof value.url === "string" && value.url.length > 0;
  const hasTitle = typeof value.title === "string" && value.title.length > 0;
  return hasId && hasUrl && hasTitle;
}

function sanitizeListings(value: unknown): Listing[] {
  const isList = Array.isArray(value);
  if (!isList) {
    return [];
  }

  const listings: Listing[] = [];

  for (const item of value) {
    const isValid = isListing(item);
    if (!isValid) {
      continue;
    }

    const hasStatus = item.status === "active" || item.status === "removed";
    listings.push({
      ...item,
      status: hasStatus ? item.status : "active",
    });
  }

  return listings;
}

function loadCustomListings(): Listing[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    return sanitizeListings(JSON.parse(raw));
  } catch {
    return [];
  }
}

function saveCustomListings(listings: Listing[]): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(listings));
  } catch {
    return;
  }
}

export function useCustomListings(visitorName: string) {
  const [customListings, setCustomListings] = useState<Listing[]>(loadCustomListings);
  const [isListingsSaveFailed, setIsListingsSaveFailed] = useState(false);

  useEffect(
    function persistCustomListingsLocally() {
      saveCustomListings(customListings);
    },
    [customListings],
  );

  useEffect(
    function loadRemoteCustomListings() {
      const hasVisitor = visitorName.length > 0;
      if (!hasVisitor) {
        return;
      }

      const client = getListingNotesClient();
      if (!client) {
        return;
      }

      let isCancelled = false;

      async function loadListings(remoteClient: SupabaseClient) {
        const { data, error } = await remoteClient.from("custom_listings").select("listing_id, payload");
        if (isCancelled) {
          return;
        }

        const hasFailed = Boolean(error) || !Array.isArray(data);
        if (hasFailed) {
          setIsListingsSaveFailed(true);
          return;
        }

        const remoteListings: Listing[] = [];

        for (const row of data) {
          const isRow = isRecord(row);
          if (!isRow) {
            continue;
          }

          const listing = isListing(row.payload) ? row.payload : null;
          if (!listing) {
            continue;
          }

          remoteListings.push(listing);
        }

        const localListings = loadCustomListings();
        const shouldUploadLocal = remoteListings.length === 0 && localListings.length > 0;
        if (shouldUploadLocal) {
          const rows = localListings.map(function toRow(listing) {
            return { listing_id: listing.id, payload: listing, ...authorNameField() };
          });
          const { error: uploadError } = await remoteClient.from("custom_listings").upsert(rows);
          if (uploadError) {
            setIsListingsSaveFailed(true);
            return;
          }

          setIsListingsSaveFailed(false);
          return;
        }

        setCustomListings(function mergeListingsState(current) {
          const byId = new Map<string, Listing>();

          for (const listing of remoteListings) {
            byId.set(listing.id, listing);
          }

          for (const listing of current) {
            const alreadyExists = byId.has(listing.id);
            if (alreadyExists) {
              continue;
            }

            byId.set(listing.id, listing);
          }

          return [...byId.values()];
        });
        setIsListingsSaveFailed(false);
      }

      void loadListings(client);

      return function cancelListingLoad() {
        isCancelled = true;
      };
    },
    [visitorName],
  );

  function addCustomListing(listing: Listing) {
    setCustomListings(function appendListing(current) {
      const alreadyExists = current.some(function hasSameId(item) {
        return item.id === listing.id;
      });
      if (alreadyExists) {
        return current;
      }

      return [...current, listing];
    });

    const client = getListingNotesClient();
    if (!client) {
      return;
    }

    async function saveListing(remoteClient: SupabaseClient) {
      const { error } = await remoteClient
        .from("custom_listings")
        .upsert({ listing_id: listing.id, payload: listing, ...authorNameField() });
      if (error) {
        setIsListingsSaveFailed(true);
        return;
      }

      setIsListingsSaveFailed(false);
    }

    void saveListing(client);
  }

  return {
    customListings,
    addCustomListing,
    isListingsSaveFailed,
  };
}
