export function isOlxListingUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    const isHttps = url.protocol === "https:";
    const host = url.hostname.toLowerCase();
    const isOlxHost = host === "olx.com.br" || host.endsWith(".olx.com.br");
    return isHttps && isOlxHost;
  } catch {
    return false;
  }
}

export function readOlxListingId(value: string): string | null {
  const matches = value.match(/\d{6,}/g);
  if (!matches) {
    return null;
  }

  return matches[matches.length - 1];
}
