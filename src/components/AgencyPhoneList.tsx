import { AGENCY_CONTACTS } from "../domain/agencyPhones";
import { PhoneLink } from "./PhoneLink";

interface Props {
  sellers: string[];
}

function renderPhoneLink(phone: string) {
  return <PhoneLink key={phone} phone={phone} />;
}

function renderAgency(seller: string) {
  const contact = AGENCY_CONTACTS[seller];
  const hasContact = Boolean(contact);

  return (
    <li key={seller}>
      <strong>{seller}</strong>
      {hasContact && contact ? (
        <span className="agency-phones__numbers">{contact.phones.map(renderPhoneLink)}</span>
      ) : (
        <span className="muted">pełnego numeru nie ma na publicznej stronie</span>
      )}
      {hasContact && contact ? <span className="muted">{contact.source}</span> : null}
      {contact?.note ? <span className="muted">{contact.note}</span> : null}
    </li>
  );
}

function compareSellers(left: string, right: string): number {
  return left.localeCompare(right, "pl");
}

export const AgencyPhoneList = (props: Props) => {
  const { sellers } = props;
  const uniqueSellers = [...new Set(sellers)].sort(compareSellers);

  return (
    <ul className="agency-phones">
      {uniqueSellers.map(renderAgency)}
    </ul>
  );
};
