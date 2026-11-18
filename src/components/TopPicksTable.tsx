import { formatBrl } from "../domain/format";
import { listingRowClassName, type ListingNote } from "../domain/listingNotes";
import type { ScoredListing } from "../types";
import { ContactCell } from "./ContactCell";
import { ListingNoteCell } from "./ListingNoteCell";
import { PropertyCell } from "./PropertyCell";
import { ScoreMeter } from "./ScoreMeter";
import { TraitList } from "./TraitList";

interface Props {
  listings: ScoredListing[];
  selectedListingId: string | null;
  onPhotoSelect: (listingId: string) => void;
  readNote: (listingId: string) => ListingNote;
  readNickname: (listingId: string) => string;
  onNoteChange: (listingId: string, note: ListingNote) => void;
  readPhones: (listing: ScoredListing) => string[];
  readPhoneDraft: (listing: ScoredListing) => string;
  onPhoneChange: (sellerKey: string, phoneText: string) => void;
  isReadOnly: boolean;
}

export const TopPicksTable = (props: Props) => {
  const {
    listings,
    selectedListingId,
    onPhotoSelect,
    readNote,
    readNickname,
    onNoteChange,
    readPhones,
    readPhoneDraft,
    onPhoneChange,
    isReadOnly,
  } = props;

  function renderRow(listing: ScoredListing, index: number) {
    const isSelected = listing.id === selectedListingId;
    const note = readNote(listing.id);
    const rowClass = listingRowClassName(isSelected, note.isRejected);

    return (
      <tr key={listing.id} className={rowClass}>
        {isReadOnly ? null : (
          <td>
            <ListingNoteCell listingId={listing.id} note={note} onNoteChange={onNoteChange} />
          </td>
        )}
        <td className="rank">{index + 1}</td>
        <td>
          <PropertyCell listing={listing} nickname={readNickname(listing.id)} onPhotoSelect={onPhotoSelect} />
        </td>
        <td>
          <ScoreMeter score={listing.qualityScore} label="Jakość domu" />
        </td>
        <td className="num">
          <strong>{formatBrl(listing.price)}</strong>
          <span className="muted">
            {listing.pricePerSquareMeter ? `${formatBrl(listing.pricePerSquareMeter)}/m²` : "brak m²"}
          </span>
        </td>
        <td>
          <ContactCell
            listing={listing}
            phones={readPhones(listing)}
            phoneDraft={readPhoneDraft(listing)}
            isReadOnly={isReadOnly}
            onPhoneChange={onPhoneChange}
          />
        </td>
        <td>
          <strong>{listing.neighborhood || "—"}</strong>
          <span className="muted">
            {listing.city} · {listing.region}
          </span>
        </td>
        <td>
          <TraitList traits={listing.traits} />
        </td>
      </tr>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {isReadOnly ? null : <th>Notatka</th>}
            <th>#</th>
            <th>Dom</th>
            <th>Jakość</th>
            <th>Cena</th>
            <th>Agencja i kontakt</th>
            <th>Okolica</th>
            <th>Dlaczego</th>
          </tr>
        </thead>
        <tbody>{listings.map(renderRow)}</tbody>
      </table>
    </div>
  );
};
