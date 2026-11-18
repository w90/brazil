import { useState } from "react";
import type { ListingNote } from "../domain/listingNotes";
import type { StarRatingView } from "../domain/listingStarRatings";
import type { ScoredListing } from "../types";
import { ListingTableRow } from "./ListingTableRow";

interface Props {
  listings: ScoredListing[];
  selectedListingId: string | null;
  onPhotoSelect: (listingId: string) => void;
  readNote: (listingId: string) => ListingNote;
  readNickname: (listingId: string) => string;
  readStarRating: (listingId: string) => StarRatingView;
  onNoteChange: (listingId: string, note: ListingNote) => void;
  onRate: (listingId: string, stars: number | null) => void;
  readPhones: (listing: ScoredListing) => string[];
  readPhoneDraft: (listing: ScoredListing) => string;
  onPhoneChange: (sellerKey: string, phoneText: string) => void;
  isReadOnly: boolean;
  emptyMessage?: string;
}

export const AllListingsTable = (props: Props) => {
  const {
    listings,
    selectedListingId,
    onPhotoSelect,
    readNote,
    readNickname,
    readStarRating,
    onNoteChange,
    onRate,
    readPhones,
    readPhoneDraft,
    onPhoneChange,
    isReadOnly,
    emptyMessage,
  } = props;
  const emptyLabel = emptyMessage ?? "Żadne ogłoszenie nie pasuje do filtra.";
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isEmpty = listings.length === 0;

  function toggleDescription(listingId: string) {
    const isSameListing = expandedId === listingId;
    if (isSameListing) {
      setExpandedId(null);
      return;
    }

    setExpandedId(listingId);
  }

  function renderRow(listing: ScoredListing) {
    const isSelected = listing.id === selectedListingId;
    const isDescriptionOpen = expandedId === listing.id;

    return (
      <ListingTableRow
        key={listing.id}
        listing={listing}
        isSelected={isSelected}
        isDescriptionOpen={isDescriptionOpen}
        onPhotoSelect={onPhotoSelect}
        onToggleDescription={toggleDescription}
        note={readNote(listing.id)}
        nickname={readNickname(listing.id)}
        starRating={readStarRating(listing.id)}
        onNoteChange={onNoteChange}
        onRate={onRate}
        phones={readPhones(listing)}
        phoneDraft={readPhoneDraft(listing)}
        isReadOnly={isReadOnly}
        onPhoneChange={onPhoneChange}
      />
    );
  }

  if (isEmpty) {
    return <p className="empty">{emptyLabel}</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {isReadOnly ? null : <th>Notatka</th>}
            <th>Dom</th>
            <th>Cena</th>
            <th>Agencja i kontakt</th>
            <th>R$/m²</th>
            <th>Ocena</th>
            <th>Jakość</th>
            <th>Okolica</th>
            <th>Metraż</th>
            <th>Atuty</th>
            <th>Condomínio</th>
            <th>Obniżka</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>{listings.map(renderRow)}</tbody>
      </table>
    </div>
  );
};
