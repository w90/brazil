import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import {
  applyRemoteStarRatingChange,
  fetchListingStarRatings,
  persistRemoteStarRating,
  uploadListingStarRatings,
  type RemoteStarRatingChange,
} from "../domain/listingStarRatingsApi";
import {
  isValidStarCount,
  loadStoredStarRatings,
  mergeLoadedStarRatings,
  omitStarRating,
  readRaterId,
  saveStoredStarRatings,
  starRatingKey,
  summarizeStarRating,
  upsertStarRating,
  type StarRatingRow,
  type StarRatingView,
  type StarRatingsByKey,
} from "../domain/listingStarRatings";
import { getListingNotesClient } from "../domain/supabaseClient";

function readNextRating(listingId: string, userId: string, stars: number | null): StarRatingRow | null {
  if (stars === null || !isValidStarCount(stars)) {
    return null;
  }

  return {
    listingId,
    userId,
    stars,
  };
}

export function useListingStarRatings() {
  const [ratingsByKey, setRatingsByKey] = useState<StarRatingsByKey>(loadStoredStarRatings);
  const [userId] = useState(readRaterId);
  const [isStarRatingsSaveFailed, setIsStarRatingsSaveFailed] = useState(false);
  const ratingsRef = useRef(ratingsByKey);
  const pendingKeysRef = useRef(new Set<string>());
  const saveVersionRef = useRef(new Map<string, number>());
  ratingsRef.current = ratingsByKey;

  useEffect(
    function persistStarRatingsLocally() {
      saveStoredStarRatings(ratingsByKey);
    },
    [ratingsByKey],
  );

  useEffect(
    function loadRemoteStarRatings() {
      const client = getListingNotesClient();
      if (!client) {
        return;
      }

      let isCancelled = false;

      async function loadRatings(remoteClient: SupabaseClient) {
        try {
          const remoteRatings = await fetchListingStarRatings(remoteClient);
          if (isCancelled) {
            return;
          }

          const merged = mergeLoadedStarRatings(
            remoteRatings,
            ratingsRef.current,
            userId,
            pendingKeysRef.current,
          );
          setRatingsByKey(merged.ratings);
          await uploadListingStarRatings(remoteClient, merged.ownRows);
          if (isCancelled) {
            return;
          }

          setIsStarRatingsSaveFailed(false);
        } catch {
          if (isCancelled) {
            return;
          }

          setIsStarRatingsSaveFailed(true);
        }
      }

      void loadRatings(client);

      return function cancelRemoteStarRatingLoad() {
        isCancelled = true;
      };
    },
    [userId],
  );

  useEffect(
    function subscribeToStarRatings() {
      const client = getListingNotesClient();
      if (!client) {
        return;
      }

      const channel = client
        .channel("listing-star-ratings")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "listing_star_ratings" },
          function handleStarRatingChange(payload: RemoteStarRatingChange) {
            setRatingsByKey(function applyChange(current) {
              return applyRemoteStarRatingChange(current, payload, pendingKeysRef.current);
            });
          },
        )
        .subscribe();

      return function unsubscribeFromStarRatings() {
        void client.removeChannel(channel);
      };
    },
    [],
  );

  function readStarRating(listingId: string): StarRatingView {
    return summarizeStarRating(ratingsByKey, listingId, userId);
  }

  function handleRate(listingId: string, stars: number | null) {
    const isCleared = stars === null;
    const isInvalidRating = !isCleared && !isValidStarCount(stars);
    if (isInvalidRating) {
      return;
    }

    const nextRow = readNextRating(listingId, userId, stars);
    const key = starRatingKey(listingId, userId);
    const nextVersion = (saveVersionRef.current.get(key) ?? 0) + 1;
    saveVersionRef.current.set(key, nextVersion);
    pendingKeysRef.current.add(key);

    setRatingsByKey(function replaceRating(current) {
      if (!nextRow) {
        return omitStarRating(current, listingId, userId);
      }

      return upsertStarRating(current, nextRow);
    });

    const client = getListingNotesClient();
    if (!client) {
      pendingKeysRef.current.delete(key);
      return;
    }

    async function saveRating(remoteClient: SupabaseClient) {
      try {
        await persistRemoteStarRating(remoteClient, nextRow, listingId, userId);
        const isLatestSave = saveVersionRef.current.get(key) === nextVersion;
        if (!isLatestSave) {
          return;
        }

        pendingKeysRef.current.delete(key);
        setIsStarRatingsSaveFailed(false);
      } catch {
        const isLatestSave = saveVersionRef.current.get(key) === nextVersion;
        if (!isLatestSave) {
          return;
        }

        pendingKeysRef.current.delete(key);
        setIsStarRatingsSaveFailed(true);
      }
    }

    void saveRating(client);
  }

  return {
    readStarRating,
    handleRate,
    isStarRatingsSaveFailed,
  };
}
