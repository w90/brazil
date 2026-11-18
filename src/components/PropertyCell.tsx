import type { SyntheticEvent } from "react";
import type { ScoredListing } from "../types";

interface Props {
  listing: ScoredListing;
  onPhotoSelect?: (listingId: string) => void;
}

export const PropertyCell = (props: Props) => {
  const { listing, onPhotoSelect } = props;
  const image = listing.image ?? "";
  const hasImage = image.length > 0;
  const canSelectOnMap = Boolean(onPhotoSelect);

  function hideBrokenPhoto(event: SyntheticEvent<HTMLImageElement>) {
    event.currentTarget.hidden = true;
  }

  function handlePhotoClick() {
    if (!onPhotoSelect) {
      return;
    }

    onPhotoSelect(listing.id);
  }

  return (
    <div className="property">
      {hasImage && canSelectOnMap ? (
        <button
          className="property__photo-button"
          type="button"
          onClick={handlePhotoClick}
          aria-label={`Pokaż na mapie: ${listing.title}`}
        >
          <img className="property__photo" src={image} alt="" referrerPolicy="no-referrer" onError={hideBrokenPhoto} />
        </button>
      ) : null}
      {hasImage && !canSelectOnMap ? (
        <img className="property__photo" src={image} alt="" referrerPolicy="no-referrer" onError={hideBrokenPhoto} />
      ) : null}
      {!hasImage ? <span className="property__photo property__photo--empty" /> : null}
      <div className="property__copy">
        <a className="property__title" href={listing.url} target="_blank" rel="noreferrer">
          {listing.title}
        </a>
        <p className="property__meta">
          {listing.summary || "brak skrótu z OLX"}
          {listing.imageCount ? ` · ${listing.imageCount} zdjęć` : ""}
        </p>
        <div className="property__flags">
          {listing.isSeasonalMention ? <span className="flag">w tekście jest temporada</span> : null}
          {listing.isStale ? <span className="flag flag--warn">stare ogłoszenie</span> : null}
          {listing.isPriceWellAboveMedian ? (
            <span className="flag flag--warn">cena/m² ponad 2× mediana</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
