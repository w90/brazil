const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

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
