export interface VisitorIdentity {
  name: string;
  isReadOnly: boolean;
}

const visitorNamesByAlias: Record<string, string> = {
  krzys: "Krzysiek",
  krzysztof: "Krzysiek",
  krzysiek: "Krzysiek",
  krzychu: "Krzysiek",
  dan: "Daniel",
  daniel: "Daniel",
  dany: "Daniel",
  lechu: "Leszek",
  leszek: "Leszek",
  leo: "Leszek",
  lech: "Leszek",
  guest: "Guest",
};

const storageKey = "brazil.visitor";
let currentVisitorName: string | null = null;

export function resolveVisitorName(rawName: string): VisitorIdentity | null {
  const normalizedName = rawName.trim().toLowerCase();
  const name = visitorNamesByAlias[normalizedName];
  if (!name) {
    return null;
  }

  return {
    name,
    isReadOnly: false,
  };
}

function isKnownVisitorName(name: string): boolean {
  return Object.values(visitorNamesByAlias).includes(name);
}

export function readStoredVisitorName(): string | null {
  try {
    const savedName = window.localStorage.getItem(storageKey);
    const hasName = typeof savedName === "string" && isKnownVisitorName(savedName);
    if (!hasName || !savedName) {
      return null;
    }

    currentVisitorName = savedName;
    return savedName;
  } catch {
    return currentVisitorName;
  }
}

export function storeVisitorName(name: string): void {
  currentVisitorName = name;
  try {
    window.localStorage.setItem(storageKey, name);
  } catch {
    return;
  }
}

export function readVisitorName(): string | null {
  if (currentVisitorName) {
    return currentVisitorName;
  }

  return readStoredVisitorName();
}

export function visitorRequestHeaders(): Record<string, string> {
  const name = readVisitorName();
  if (!name) {
    return {};
  }

  return {
    "x-visitor-name": name,
  };
}

export function authorNameField(): { author_name: string } {
  return {
    author_name: readVisitorName() ?? "",
  };
}
