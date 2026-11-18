import type { ScoredListing } from "../types";

interface Props {
  listings: ScoredListing[];
}

function renderRemoved(listing: ScoredListing) {
  return (
    <li key={listing.id}>
      <a href={listing.url} target="_blank" rel="noreferrer">
        {listing.title}
      </a>
      <span className="muted">OLX: ogłoszenie nie istnieje</span>
    </li>
  );
}

export const RemovedListings = (props: Props) => {
  const { listings } = props;

  return <ul className="removed">{listings.map(renderRemoved)}</ul>;
};
