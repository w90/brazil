import { useEffect, useState } from "react";
import type { ListingNote } from "../domain/listingNotes";
import type { ScoredListing } from "../types";
import { ListingTableRow } from "./ListingTableRow";

interface Props {
  listing: ScoredListing | null;
  onPhotoSelect: (listingId: string) => void;
  readNote: (listingId: string) => ListingNote;
  readNickname: (listingId: string) => string;
  onNoteChange: (listingId: string, note: ListingNote) => void;
  readPhones: (listing: ScoredListing) => string[];
  readPhoneDraft: (listing: ScoredListing) => string;
  onPhoneChange: (sellerKey: string, phoneText: string) => void;
  isReadOnly: boolean;
}

export const SelectedListing = (props: Props) => {
  const {
    listing,
    onPhotoSelect,
    readNote,
    readNickname,
    onNoteChange,
    readPhones,
    readPhoneDraft,
    onPhoneChange,
    isReadOnly,
  } = props;
  const [openListingId, setOpenListingId] = useState<string | null>(null);

  useEffect(
    function closeDescriptionWhenListingChanges() {
      setOpenListingId(null);
    },
    [listing?.id],
  );

  function handleToggleDescription(listingId: string) {
    const isSameListing = openListingId === listingId;
    if (isSameListing) {
      setOpenListingId(null);
      return;
    }

    setOpenListingId(listingId);
  }

  if (!listing) {
    return (
      <p className="map-selection map-selection--empty">
        Kliknij pin na mapie. Tutaj pojawi się cały wiersz z listy.
      </p>
    );
  }

  const isDescriptionOpen = openListingId === listing.id;

  return (
    <div className="map-selection">
      <p className="map-selection__label">Wybrane ogłoszenie</p>
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
          <tbody>
            <ListingTableRow
              listing={listing}
              isSelected={false}
              isDescriptionOpen={isDescriptionOpen}
              note={readNote(listing.id)}
              nickname={readNickname(listing.id)}
              phones={readPhones(listing)}
              phoneDraft={readPhoneDraft(listing)}
              isReadOnly={isReadOnly}
              onPhotoSelect={onPhotoSelect}
              onToggleDescription={handleToggleDescription}
              onNoteChange={onNoteChange}
              onPhoneChange={onPhoneChange}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
};
