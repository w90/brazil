const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const eurFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const plnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

// NBP tabela A 224/A/NBP/2026 z 18 listopada 2026.
const plnPerBrl = 0.6952;
const plnPerEur = 4.4089;

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatBrl(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return brlFormatter.format(value);
}

export function formatEurFromBrl(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return eurFormatter.format((value * plnPerBrl) / plnPerEur);
}

export function formatPlnFromBrl(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return plnFormatter.format(value * plnPerBrl);
}

export function formatArea(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value} m²`;
}

export function formatPublishedAt(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) {
    return "—";
  }

  return dateFormatter.format(new Date(unixSeconds * 1000));
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return String(value);
}
