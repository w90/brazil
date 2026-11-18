import { findAgencyContact } from "../domain/agencyPhones";
import type { ScoredListing } from "../types";
import { PhoneLink } from "./PhoneLink";

interface Props {
  listing: ScoredListing;
}

function renderPhoneLink(phone: string) {
  return <PhoneLink key={phone} className="contact__phone" phone={phone} />;
}

export const ContactCell = (props: Props) => {
  const { listing } = props;
  const seller = listing.seller || "brak nazwy";
  const contact = findAgencyContact(listing.seller);
  const hasContact = Boolean(contact);
  const profile = listing.profile ?? "";
  const hasProfile = profile.length > 0;
  const olxPhone = listing.phone || "";
  const hasOlxPhone = olxPhone.length > 0;

  return (
    <div className="contact">
      <strong>{seller}</strong>
      {hasContact && contact ? contact.phones.map(renderPhoneLink) : null}
      {hasContact ? null : (
        <span className="contact__phone">{hasOlxPhone ? olxPhone : "brak numeru"}</span>
      )}
      {hasContact ? null : <span className="contact__note">pełnego numeru nie znalazłem publicznie</span>}
      {hasProfile ? (
        <a href={profile} target="_blank" rel="noreferrer">
          profil OLX
        </a>
      ) : null}
    </div>
  );
};
