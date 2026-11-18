import { toBrazilPhoneDigits, toWhatsAppHref } from "../domain/agencyPhones";

interface Props {
  phone: string;
  className?: string;
}

export const PhoneLink = (props: Props) => {
  const { phone, className } = props;
  const internationalNumber = `+${toBrazilPhoneDigits(phone)}`;

  return (
    <a className={className} href={toWhatsAppHref(phone)} title={`WhatsApp ${internationalNumber}`}>
      {phone}
    </a>
  );
};
