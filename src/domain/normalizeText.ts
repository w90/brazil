export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[-/]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

export function includesAny(text: string, needles: string[]): boolean {
  function isNeedlePresent(needle: string): boolean {
    return text.includes(needle);
  }

  return needles.some(isNeedlePresent);
}
