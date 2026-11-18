import type { ChangeEvent } from "react";
import { listingCommentMaxLength, type ListingNote } from "../domain/listingNotes";

interface Props {
  listingId: string;
  note: ListingNote;
  onNoteChange: (listingId: string, note: ListingNote) => void;
}

export const ListingNoteCell = (props: Props) => {
  const { listingId, note, onNoteChange } = props;

  function handleCommentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onNoteChange(listingId, {
      comment: event.currentTarget.value.slice(0, listingCommentMaxLength),
      isHighlighted: note.isHighlighted,
      isRejected: note.isRejected,
      isContacted: note.isContacted,
    });
  }

  function handleHighlightedChange(event: ChangeEvent<HTMLInputElement>) {
    onNoteChange(listingId, {
      comment: note.comment,
      isHighlighted: event.currentTarget.checked,
      isRejected: note.isRejected,
      isContacted: note.isContacted,
    });
  }

  function handleRejectedChange(event: ChangeEvent<HTMLInputElement>) {
    onNoteChange(listingId, {
      comment: note.comment,
      isHighlighted: note.isHighlighted,
      isRejected: event.currentTarget.checked,
      isContacted: note.isContacted,
    });
  }

  function handleContactedChange(event: ChangeEvent<HTMLInputElement>) {
    onNoteChange(listingId, {
      comment: note.comment,
      isHighlighted: note.isHighlighted,
      isRejected: note.isRejected,
      isContacted: event.currentTarget.checked,
    });
  }

  return (
    <div className="listing-note">
      <textarea
        className="listing-note__comment"
        maxLength={listingCommentMaxLength}
        rows={3}
        value={note.comment}
        onChange={handleCommentChange}
        placeholder="Komentarz"
        aria-label={`Komentarz: ${listingId}`}
      />
      <span className="listing-note__count">
        {note.comment.length}/{listingCommentMaxLength}
      </span>
      <label className="listing-note__check">
        <input
          type="checkbox"
          checked={note.isHighlighted}
          onChange={handleHighlightedChange}
        />
        Wyróżnione
      </label>
      <label className="listing-note__check">
        <input type="checkbox" checked={note.isRejected} onChange={handleRejectedChange} />
        Odrzucone
      </label>
      <label className="listing-note__check">
        <input type="checkbox" checked={note.isContacted} onChange={handleContactedChange} />
        Skontaktowałem się
      </label>
    </div>
  );
};
