const storageKey = "brazil.listing-notes";
const previousStorageKey = "angra-homes.listing-notes";

export const listingCommentMaxLength = 500;

export interface ListingNote {
  comment: string;
  isHighlighted: boolean;
  isRejected: boolean;
  isContacted: boolean;
}

export type ListingNotesById = Record<string, ListingNote>;

export function createEmptyListingNote(): ListingNote {
  return {
    comment: "",
    isHighlighted: false,
    isRejected: false,
    isContacted: false,
  };
}

export function isEmptyListingNote(note: ListingNote): boolean {
  const hasComment = note.comment.length > 0;
  const hasFlag = note.isHighlighted || note.isRejected || note.isContacted;
  const isEmpty = !hasComment && !hasFlag;
  return isEmpty;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object";
  const isNotNull = value !== null;
  return isObject && isNotNull;
}

function readComment(value: unknown): string {
  const isText = typeof value === "string";
  if (!isText) {
    return "";
  }

  return value.slice(0, listingCommentMaxLength);
}

function readFlag(value: unknown): boolean {
  return value === true;
}

function sanitizeNote(value: unknown): ListingNote | null {
  const isNoteRecord = isRecord(value);
  if (!isNoteRecord) {
    return null;
  }

  const note: ListingNote = {
    comment: readComment(value.comment),
    isHighlighted: readFlag(value.isHighlighted),
    isRejected: readFlag(value.isRejected),
    isContacted: readFlag(value.isContacted),
  };

  const isEmpty = isEmptyListingNote(note);
  if (isEmpty) {
    return null;
  }

  return note;
}

function readStoredNotes(key: string): ListingNotesById | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  const parsed: unknown = JSON.parse(raw);
  const isNotesRecord = isRecord(parsed);
  if (!isNotesRecord) {
    return {};
  }

  const notes: ListingNotesById = {};

  for (const listingId of Object.keys(parsed)) {
    const note = sanitizeNote(parsed[listingId]);
    if (!note) {
      continue;
    }

    notes[listingId] = note;
  }

  return notes;
}

export function loadListingNotes(): ListingNotesById {
  try {
    const currentNotes = readStoredNotes(storageKey);
    const hasCurrentNotes = currentNotes !== null;
    if (hasCurrentNotes) {
      return currentNotes;
    }

    const previousNotes = readStoredNotes(previousStorageKey);
    if (!previousNotes) {
      return {};
    }

    return previousNotes;
  } catch {
    return {};
  }
}

export function saveListingNotes(notes: ListingNotesById): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(notes));
    window.localStorage.removeItem(previousStorageKey);
  } catch {
    return;
  }
}

export function omitListingNote(notes: ListingNotesById, listingId: string): ListingNotesById {
  const nextNotes: ListingNotesById = {};

  for (const id of Object.keys(notes)) {
    const isTarget = id === listingId;
    if (isTarget) {
      continue;
    }

    nextNotes[id] = notes[id];
  }

  return nextNotes;
}

export function listingRowClassName(isSelected: boolean, isRejected: boolean): string | undefined {
  const classNames: string[] = [];

  if (isSelected) {
    classNames.push("is-selected");
  }

  if (isRejected) {
    classNames.push("is-rejected");
  }

  const hasClassName = classNames.length > 0;
  if (!hasClassName) {
    return undefined;
  }

  return classNames.join(" ");
}
