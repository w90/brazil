import { Fragment } from "react";
import { formatBrl, formatPublishedAt } from "../domain/format";
import { listingRowClassName, type ListingNote } from "../domain/listingNotes";
import type { ScoredListing } from "../types";
import { ContactCell } from "./ContactCell";
import { ListingNoteCell } from "./ListingNoteCell";
import { PropertyCell } from "./PropertyCell";
import { ScoreMeter } from "./ScoreMeter";
import { TraitList } from "./TraitList";

interface Props {
  listing: ScoredListing;
  isSelected: boolean;
  isDescriptionOpen: boolean;
  note: ListingNote;
  nickname: string;
  isReadOnly: boolean;
  phones: string[];
  phoneDraft: string;
  onPhotoSelect: (listingId: string) => void;
  onToggleDescription: (listingId: string) => void;
  onNoteChange: (listingId: string, note: ListingNote) => void;
  onPhoneChange: (sellerKey: string, phoneText: string) => void;
}

function bathroomLabel(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const digits = value.match(/\d+/);
  if (!digits) {
    return "";
  }

  const isMinimum = /ou mais/i.test(value);
  if (isMinimum) {
    return `${digits[0]}+ łaz.`;
  }

  return `${digits[0]} łaz.`;
}

function sizeLine(listing: ScoredListing): string {
  const parts = [
    listing.area ? `${listing.area} m²` : "",
    listing.bedrooms ? `${listing.bedrooms} pok.` : "",
    listing.suites ? `${listing.suites} suit` : "",
    bathroomLabel(listing.bathrooms),
    listing.parking ? `${listing.parking} garaż` : "",
  ];

  function isFilled(part: string): boolean {
    return part.length > 0;
  }

  const filled = parts.filter(isFilled);
  if (filled.length === 0) {
    return "—";
  }

  return filled.join(" · ");
}

export const ListingTableRow = (props: Props) => {
  const {
    listing,
    isSelected,
    isDescriptionOpen,
    note,
    nickname,
    isReadOnly,
    phones,
    phoneDraft,
    onPhotoSelect,
    onToggleDescription,
    onNoteChange,
    onPhoneChange,
  } = props;
  const description = listing.description ?? "";
  const hasDescription = description.length > 0;
  const discount = listing.discountPercent === null ? "—" : `−${listing.discountPercent}%`;
  const rowClass = listingRowClassName(isSelected, note.isRejected);
  const descriptionSpan = isReadOnly ? 12 : 13;

  function handleToggle() {
    onToggleDescription(listing.id);
  }

  return (
    <Fragment>
      <tr className={rowClass}>
        {isReadOnly ? null : (
          <td>
            <ListingNoteCell listingId={listing.id} note={note} onNoteChange={onNoteChange} />
          </td>
        )}
        <td>
          <PropertyCell listing={listing} nickname={nickname} onPhotoSelect={onPhotoSelect} />
          {hasDescription ? (
            <button className="text-button" type="button" onClick={handleToggle}>
              {isDescriptionOpen ? "Ukryj opis" : "Pokaż opis"}
            </button>
          ) : null}
        </td>
        <td className="num">
          <strong>{formatBrl(listing.price)}</strong>
          {listing.previousPrice ? (
            <span className="muted strike">{formatBrl(listing.previousPrice)}</span>
          ) : null}
        </td>
        <td>
          <ContactCell
            listing={listing}
            phones={phones}
            phoneDraft={phoneDraft}
            isReadOnly={isReadOnly}
            onPhoneChange={onPhoneChange}
          />
        </td>
        <td className="num">{listing.pricePerSquareMeter ? formatBrl(listing.pricePerSquareMeter) : "—"}</td>
        <td>
          <ScoreMeter score={listing.rating} label="Ocena: jakość i cena za metr" />
        </td>
        <td>
          <ScoreMeter score={listing.qualityScore} label="Sama jakość domu" />
        </td>
        <td>
          <strong>{listing.neighborhood || "—"}</strong>
          <span className="muted">
            {listing.city} · {listing.region}
            {listing.zip ? ` · ${listing.zip}` : ""}
          </span>
        </td>
        <td>{sizeLine(listing)}</td>
        <td>
          <TraitList traits={listing.traits} />
        </td>
        <td className="num">{formatBrl(listing.condoFee)}</td>
        <td className="num">{discount}</td>
        <td>{formatPublishedAt(listing.publishedAt)}</td>
      </tr>
      {isDescriptionOpen ? (
        <tr className="description-row">
          <td colSpan={descriptionSpan}>
            <p>{description}</p>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
};
