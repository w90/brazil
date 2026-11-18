import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import {
  applyRemoteListingNoteChange,
  fetchListingNotes,
  mergeRemoteNotes,
  persistRemoteListingNote,
  uploadListingNotes,
} from "../domain/listingNotesApi";
import {
  createEmptyListingNote,
  isEmptyListingNote,
  listingCommentMaxLength,
  loadListingNotes,
  omitListingNote,
  saveListingNotes,
  type ListingNote,
  type ListingNotesById,
} from "../domain/listingNotes";
import { getListingNotesClient } from "../domain/supabaseClient";

export function useListingNotes() {
  const [notesById, setNotesById] = useState<ListingNotesById>(loadListingNotes);
  const [isNotesSaveFailed, setIsNotesSaveFailed] = useState(false);
  const notesRef = useRef(notesById);
  const pendingIdsRef = useRef(new Set<string>());
  const saveVersionRef = useRef(new Map<string, number>());
  notesRef.current = notesById;

  useEffect(
    function persistListingNotesLocally() {
      saveListingNotes(notesById);
    },
    [notesById],
  );

  useEffect(
    function loadRemoteListingNotes() {
      const client = getListingNotesClient();
      if (!client) {
        return;
      }

      let isCancelled = false;

      async function loadNotes(remoteClient: SupabaseClient) {
        try {
          const remoteNotes = await fetchListingNotes(remoteClient);
          if (isCancelled) {
            return;
          }

          const localNotes = notesRef.current;
          const remoteCount = Object.keys(remoteNotes).length;
          const localCount = Object.keys(localNotes).length;
          const shouldUploadLocal = remoteCount === 0 && localCount > 0;
          if (shouldUploadLocal) {
            await uploadListingNotes(remoteClient, localNotes);
            if (isCancelled) {
              return;
            }

            setIsNotesSaveFailed(false);
            return;
          }

          setNotesById(function replaceWithRemote(current) {
            return mergeRemoteNotes(remoteNotes, current, pendingIdsRef.current);
          });
          setIsNotesSaveFailed(false);
        } catch {
          if (isCancelled) {
            return;
          }

          setIsNotesSaveFailed(true);
        }
      }

      void loadNotes(client);

      return function cancelRemoteLoad() {
        isCancelled = true;
      };
    },
    [],
  );

  useEffect(
    function subscribeToListingNotes() {
      const client = getListingNotesClient();
      if (!client) {
        return;
      }

      const channel = client
        .channel("listing-notes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "listing_notes" },
          function handleListingNoteChange(payload) {
            setNotesById(function applyChange(current) {
              return applyRemoteListingNoteChange(current, payload, pendingIdsRef.current);
            });
          },
        )
        .subscribe();

      return function unsubscribeFromListingNotes() {
        void client.removeChannel(channel);
      };
    },
    [],
  );

  function readNote(listingId: string): ListingNote {
    return notesById[listingId] ?? createEmptyListingNote();
  }

  function handleNoteChange(listingId: string, note: ListingNote) {
    const nextNote: ListingNote = {
      comment: note.comment.slice(0, listingCommentMaxLength),
      isHighlighted: note.isHighlighted,
      isRejected: note.isRejected,
      isContacted: note.isContacted,
    };
    const nextVersion = (saveVersionRef.current.get(listingId) ?? 0) + 1;
    saveVersionRef.current.set(listingId, nextVersion);
    pendingIdsRef.current.add(listingId);

    setNotesById(function replaceNote(current) {
      const shouldRemove = isEmptyListingNote(nextNote);
      if (shouldRemove) {
        return omitListingNote(current, listingId);
      }

      return {
        ...current,
        [listingId]: nextNote,
      };
    });

    const client = getListingNotesClient();
    if (!client) {
      pendingIdsRef.current.delete(listingId);
      return;
    }

    async function saveNote(remoteClient: SupabaseClient) {
      try {
        await persistRemoteListingNote(remoteClient, listingId, nextNote);
        const isLatestSave = saveVersionRef.current.get(listingId) === nextVersion;
        if (!isLatestSave) {
          return;
        }

        pendingIdsRef.current.delete(listingId);
        setIsNotesSaveFailed(false);
      } catch {
        const isLatestSave = saveVersionRef.current.get(listingId) === nextVersion;
        if (!isLatestSave) {
          return;
        }

        pendingIdsRef.current.delete(listingId);
        setIsNotesSaveFailed(true);
      }
    }

    void saveNote(client);
  }

  return {
    notesById,
    readNote,
    handleNoteChange,
    isNotesSaveFailed,
  };
}
