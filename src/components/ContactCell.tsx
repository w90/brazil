import { useEffect, useState, type ChangeEvent } from "react";
import { agencyPhoneKey } from "../domain/agencyPhoneKey";
import type { ScoredListing } from "../types";
import { PhoneLink } from "./PhoneLink";

interface Props {
  listing: ScoredListing;
  phones: string[];
  phoneDraft: string;
  isReadOnly: boolean;
  onPhoneChange: (sellerKey: string, phoneText: string) => void;
}

function renderPhoneLink(phone: string) {
  return <PhoneLink key={phone} className="contact__phone" phone={phone} />;
}

export const ContactCell = (props: Props) => {
  const { listing, phones, phoneDraft, isReadOnly, onPhoneChange } = props;
  const [draft, setDraft] = useState(phoneDraft);
  const seller = listing.seller || "brak nazwy";
  const sellerKey = agencyPhoneKey(listing);
  const profile = listing.profile ?? "";
  const hasProfile = profile.length > 0;
  const hasPhones = phones.length > 0;

  useEffect(
    function syncPhoneDraft() {
      setDraft(phoneDraft);
    },
    [phoneDraft],
  );

  function handleDraftChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
  }

  function handleSave() {
    onPhoneChange(sellerKey, draft);
  }

  return (
    <div className="contact">
      <strong>{seller}</strong>
      {hasPhones ? phones.map(renderPhoneLink) : <span className="contact__phone">brak numeru</span>}
      {hasPhones ? null : <span className="contact__note">pełnego numeru nie znalazłem publicznie</span>}
      {isReadOnly ? null : (
        <label className="contact__edit">
          <span>Numer</span>
          <input value={draft} onChange={handleDraftChange} placeholder="(24) 99999-9999" />
          <button type="button" onClick={handleSave}>
            Zapisz numer
          </button>
        </label>
      )}
      {hasProfile ? (
        <a href={profile} target="_blank" rel="noreferrer">
          profil OLX
        </a>
      ) : null}
    </div>
  );
};
