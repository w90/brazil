import type { ScoredListing } from "../types";

interface Props {
  listings: ScoredListing[];
  readNickname: (listingId: string) => string;
}

export const RemovedListings = (props: Props) => {
  const { listings, readNickname } = props;

  function renderRemoved(listing: ScoredListing) {
    const trimmedNickname = readNickname(listing.id).trim();
    const hasNickname = trimmedNickname.length > 0;

    return (
      <li key={listing.id}>
        <div className="removed__name">
          {hasNickname ? <p className="property__nickname">{trimmedNickname}</p> : null}
          <a href={listing.url} target="_blank" rel="noreferrer">
            {listing.title}
          </a>
        </div>
        <span className="muted">OLX: ogłoszenie nie istnieje</span>
      </li>
    );
  }

  return <ul className="removed">{listings.map(renderRemoved)}</ul>;
};
