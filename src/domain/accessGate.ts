export type AccessMode = "full" | "read";

const fullAccessCodes = [110, 97, 114, 118, 105];
const readAccessCodes = [111, 107];

function decodeCodes(codes: number[]): string {
  let text = "";

  for (const code of codes) {
    text += String.fromCharCode(code);
  }

  return text;
}

export function readAccessMode(password: string): AccessMode | null {
  const trimmed = password.trim();
  const isFullAccess = trimmed === decodeCodes(fullAccessCodes);
  if (isFullAccess) {
    return "full";
  }

  const isReadAccess = trimmed === decodeCodes(readAccessCodes);
  if (isReadAccess) {
    return "read";
  }

  return null;
}

export function storageValueForMode(mode: AccessMode): string {
  const isFullAccess = mode === "full";
  if (isFullAccess) {
    return "a";
  }

  return "b";
}

export function modeFromStorage(value: string | null): AccessMode | null {
  const isFullAccess = value === "a";
  if (isFullAccess) {
    return "full";
  }

  const isReadAccess = value === "b";
  if (isReadAccess) {
    return "read";
  }

  return null;
}
