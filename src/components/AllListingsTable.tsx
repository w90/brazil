import { useState } from "react";
import type { ListingNote } from "../domain/listingNotes";
import type { ScoredListing } from "../types";
import { ListingTableRow } from "./ListingTableRow";

interface Props {
  listings: ScoredListing[];
  selectedListingId: string | null;
  onPhotoSelect: (listingId: string) => void;
  readNote: (listingId: string) => ListingNote;
  onNoteChange: (listingId: string, note: ListingNote) => void;
}

export const AllListingsTable = (props: Props) => {
  const { listings, selectedListingId, onPhotoSelect, readNote, onNoteChange } = props;
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
        onNoteChange={onNoteChange}
      />
    );
  }

  if (isEmpty) {
    return <p className="empty">Żadne ogłoszenie nie pasuje do filtra.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Notatka</th>
            <th>Dom</th>
            <th>Cena</th>
            <th>R$/m²</th>
            <th>Ocena</th>
            <th>Jakość</th>
            <th>Okolica</th>
            <th>Metraż</th>
            <th>Agencja i kontakt</th>
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
