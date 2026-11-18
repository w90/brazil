export interface AgencyContact {
  phones: string[];
  source: string;
  note?: string;
}

export const AGENCY_CONTACTS: Record<string, AgencyContact> = {
  "Canaã Imóveis De Luxo": {
    phones: ["(24) 99994-9992", "(24) 99995-9992", "(24) 99993-9995"],
    source: "canaaluxo.com",
  },
  "Matchimob.Com": {
    phones: ["(21) 99649-7531"],
    source: "matchimob.com",
  },
  "Destac Angra Imóveis": {
    phones: ["(24) 99929-6433"],
    source: "Google / cylex, zgadza się z prefiksem OLX",
  },
  "Bella Angra Imobiliaria": {
    phones: ["(24) 99967-7222", "(21) 98619-4760"],
    source: "bellaangra.com.br",
  },
  "Imobiliária Zenatti": {
    phones: ["(24) 3365-3881", "(24) 99904-8870"],
    source: "zenattiimoveis.com.br",
    note: "pierwszy to numer z ogłoszenia, drugi to plantão",
  },
  "Daniel Smith": {
    phones: ["(24) 99813-2167", "(24) 3367-6685"],
    source: "corretaimoveisangra.com.br",
    note: "Correta Imóveis Angra",
  },
  "Easy Imóveis Angra": {
    phones: ["(24) 99995-9992", "(24) 99995-9998"],
    source: "easyimoveisangra.com",
  },
  "Homehub Costa Verde": {
    phones: ["(21) 98039-3333"],
    source: "cadastro da empresa, prefiks jak na OLX",
  },
  "Nova Imobiliária": {
    phones: ["(21) 99519-6598"],
    source: "novaimobiliaria.imb.br",
  },
  "Lobao Imoveis": {
    phones: ["(24) 99944-7070", "(24) 99977-7070"],
    source: "lobaoimoveis.com",
  },
  "Prime Imóveis": {
    phones: ["(21) 98891-6161", "(21) 2703-9003"],
    source: "primeconsultoriaimobiliaria.com",
  },
  "Prime Residence": {
    phones: ["(22) 99261-0440", "(22) 2022-3249"],
    source: "primeresidenceimob.com.br",
  },
  "Privilégio Investimentos Imobiliários": {
    phones: ["(21) 3507-2001"],
    source: "privilegioimoveis.com.br",
  },
  "Rj Home": {
    phones: ["(21) 98173-7744"],
    source: "rjhome.com.br",
  },
  "Marvila Vendas": {
    phones: ["(21) 99855-3758"],
    source: "wizytówka biura",
  },
  "Bossa Nova Sotheby'S Rj": {
    phones: ["(21) 3500-0370"],
    source: "bnsir.com.br, biuro Rio",
  },
  "Patrimóvel Barra - PTM": {
    phones: ["(21) 3539-6100"],
    source: "patrimovel.com.br, loja Barra",
  },
  "Quadra Realty": {
    phones: ["(11) 2776-2129", "(11) 97056-4335"],
    source: "quadrarealty.com.br",
  },
  "Lucas Ferreira Imóveis": {
    phones: ["(82) 99822-4847"],
    source: "numer wpisany w opisie ogłoszenia",
  },
  "Rn Dias Imóveis": {
    phones: ["(21) 98183-4235"],
    source: "rndiasimoveis.com.br",
    note: "to WhatsApp ze strony biura; linia na OLX zaczyna się od (21) 98103",
  },
};

export function findAgencyContact(seller: string | undefined): AgencyContact | null {
  if (!seller) {
    return null;
  }

  return AGENCY_CONTACTS[seller] ?? null;
}

export function toBrazilPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const isLongEnoughForCountryCode = digits.length >= 12;
  const startsWithBrazilCode = digits.startsWith("55");
  const hasCountryCode = isLongEnoughForCountryCode && startsWithBrazilCode;
  if (hasCountryCode) {
    return digits;
  }

  return `55${digits}`;
}

export function toWhatsAppHref(phone: string): string {
  return `whatsapp://send?phone=${toBrazilPhoneDigits(phone)}`;
}

export function toTelHref(phone: string): string {
  return `tel:+${toBrazilPhoneDigits(phone)}`;
}
