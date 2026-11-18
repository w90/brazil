import { useState } from "react";
import { modeFromStorage, readAccessMode, storageValueForMode, type AccessMode } from "../domain/accessGate";

const storageKey = "brazil.view";

function readStoredMode(): AccessMode | null {
  try {
    const savedMode = modeFromStorage(window.localStorage.getItem(storageKey));
    const isFullAccess = savedMode === "full";
    if (isFullAccess) {
      return savedMode;
    }

    return modeFromStorage(window.sessionStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

function storeMode(mode: AccessMode): void {
  const isFullAccess = mode === "full";
  if (isFullAccess) {
    try {
      window.localStorage.setItem(storageKey, storageValueForMode(mode));
    } catch {
      return;
    }

    return;
  }

  try {
    window.sessionStorage.setItem(storageKey, storageValueForMode(mode));
  } catch {
    return;
  }
}

export function useAccessGate() {
  const [accessMode, setAccessMode] = useState<AccessMode | null>(readStoredMode);
  const isLocked = accessMode === null;
  const isReadOnly = accessMode === "read";

  function handleUnlock(password: string): boolean {
    const mode = readAccessMode(password);
    const isAccepted = mode !== null;
    if (!isAccepted || !mode) {
      return false;
    }

    storeMode(mode);
    setAccessMode(mode);
    return true;
  }

  return {
    isLocked,
    isReadOnly,
    handleUnlock,
  };
}
