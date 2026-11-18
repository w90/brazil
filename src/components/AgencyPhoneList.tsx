import { AGENCY_CONTACTS } from "../domain/agencyPhones";
import { PhoneLink } from "./PhoneLink";

interface Props {
  sellers: string[];
  readPhones: (seller: string) => string[];
}

function renderPhoneLink(phone: string) {
  return <PhoneLink key={phone} phone={phone} />;
}

function compareSellers(left: string, right: string): number {
  return left.localeCompare(right, "pl");
}

export const AgencyPhoneList = (props: Props) => {
  const { sellers, readPhones } = props;
  const uniqueSellers = [...new Set(sellers)].sort(compareSellers);

  function renderAgency(seller: string) {
    const phones = readPhones(seller);
    const contact = AGENCY_CONTACTS[seller];
    const hasPhones = phones.length > 0;
    const hasSource = Boolean(contact);

    return (
      <li key={seller}>
        <strong>{seller}</strong>
        {hasPhones ? <span className="agency-phones__numbers">{phones.map(renderPhoneLink)}</span> : null}
        {hasPhones ? null : <span className="muted">pełnego numeru nie ma na publicznej stronie</span>}
        {hasSource && contact ? <span className="muted">{contact.source}</span> : null}
        {contact?.note ? <span className="muted">{contact.note}</span> : null}
      </li>
    );
  }

  return <ul className="agency-phones">{uniqueSellers.map(renderAgency)}</ul>;
};
