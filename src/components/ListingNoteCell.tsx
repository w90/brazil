import type { ChangeEvent } from "react";
import { listingCommentMaxLength, type ListingNote } from "../domain/listingNotes";
import type { StarRatingView } from "../domain/listingStarRatings";
import { StarRating } from "./StarRating";

interface Props {
  listingId: string;
  note: ListingNote;
  starRating: StarRatingView;
  onNoteChange: (listingId: string, note: ListingNote) => void;
  onRate: (listingId: string, stars: number | null) => void;
}

export const ListingNoteCell = (props: Props) => {
  const { listingId, note, starRating, onNoteChange, onRate } = props;

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
        <input type="checkbox" checked={note.isContacted} onChange={handleContactedChange} />
        Skontaktowałem się
      </label>
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
      <StarRating listingId={listingId} starRating={starRating} onRate={onRate} />
    </div>
  );
};
