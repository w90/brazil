import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { fetchListingNicknames, uploadMissingNicknames } from "../domain/listingNicknamesApi";
import {
  loadStoredNicknames,
  nicknameSignature,
  resolveListingNicknames,
  saveStoredNicknames,
  type ListingNicknamesById,
} from "../domain/listingNicknames";
import { getListingNotesClient } from "../domain/supabaseClient";

interface RemoteNicknameChange {
  eventType: string;
  new: unknown;
  old: { listing_id?: string };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object";
  const isNotNull = value !== null;
  return isObject && isNotNull;
}

function readChangedListingId(payload: RemoteNicknameChange): string | null {
  const isDelete = payload.eventType === "DELETE";
  const source = isDelete ? payload.old : payload.new;
  const isRow = isRecord(source);
  if (!isRow || typeof source.listing_id !== "string" || source.listing_id.length === 0) {
    return null;
  }

  return source.listing_id;
}

function readChangedNickname(value: unknown): string {
  const isRow = isRecord(value);
  if (!isRow || typeof value.nickname !== "string") {
    return "";
  }

  return value.nickname.trim();
}

export function useListingNicknames(listingIds: string[]) {
  const [storedNicknames, setStoredNicknames] = useState<ListingNicknamesById>(loadStoredNicknames);
  const [isNicknamesSaveFailed, setIsNicknamesSaveFailed] = useState(false);
  const listingIdKey = listingIds.join("\n");
  const nicknames = resolveListingNicknames(listingIds, storedNicknames);
  const nicknameKey = nicknameSignature(nicknames);

  useEffect(
    function persistListingNicknamesLocally() {
      const isUnchanged = nicknameKey === nicknameSignature(storedNicknames);
      if (isUnchanged) {
        return;
      }

      saveStoredNicknames(nicknames);
      setStoredNicknames(nicknames);
    },
    [nicknameKey, nicknames, storedNicknames],
  );

  useEffect(
    function syncListingNicknames() {
      const client = getListingNotesClient();
      if (!client) {
        return;
      }

      let isCancelled = false;

      async function syncNicknames(remoteClient: SupabaseClient) {
        try {
          const remoteNicknames = await fetchListingNicknames(remoteClient);
          if (isCancelled) {
            return;
          }

          const baseNicknames = { ...loadStoredNicknames(), ...remoteNicknames };
          const resolvedNicknames = resolveListingNicknames(listingIds, baseNicknames);
          const isUnchanged = nicknameSignature(resolvedNicknames) === nicknameSignature(storedNicknames);
          if (!isUnchanged) {
            saveStoredNicknames(resolvedNicknames);
            setStoredNicknames(resolvedNicknames);
          }

          await uploadMissingNicknames(remoteClient, resolvedNicknames, remoteNicknames);
          if (isCancelled) {
            return;
          }

          setIsNicknamesSaveFailed(false);
        } catch {
          if (isCancelled) {
            return;
          }

          setIsNicknamesSaveFailed(true);
        }
      }

      void syncNicknames(client);

      return function cancelNicknameSync() {
        isCancelled = true;
      };
    },
    [listingIdKey, listingIds, storedNicknames],
  );

  useEffect(
    function subscribeToListingNicknames() {
      const client = getListingNotesClient();
      if (!client) {
        return;
      }

      const channel = client
        .channel("listing-nicknames")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "listing_nicknames" },
          function handleNicknameChange(payload: RemoteNicknameChange) {
            const listingId = readChangedListingId(payload);
            if (!listingId) {
              return;
            }

            setStoredNicknames(function applyRemoteNickname(current) {
              const nextNicknames = { ...current };
              const isDelete = payload.eventType === "DELETE";
              if (isDelete) {
                delete nextNicknames[listingId];
                return nextNicknames;
              }

              const nickname = readChangedNickname(payload.new);
              const hasNickname = nickname.length > 0;
              if (!hasNickname) {
                return current;
              }

              nextNicknames[listingId] = nickname;
              return nextNicknames;
            });
          },
        )
        .subscribe();

      return function unsubscribeFromListingNicknames() {
        void client.removeChannel(channel);
      };
    },
    [],
  );

  return {
    nicknames,
    isNicknamesSaveFailed,
  };
}
