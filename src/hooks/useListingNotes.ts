import { useEffect, useState } from "react";
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

export function useListingNotes() {
  const [notesById, setNotesById] = useState<ListingNotesById>(loadListingNotes);

  useEffect(
    function persistListingNotes() {
      saveListingNotes(notesById);
    },
    [notesById],
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
  }

  return {
    notesById,
    readNote,
    handleNoteChange,
  };
}
