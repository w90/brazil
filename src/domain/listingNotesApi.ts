import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isEmptyListingNote,
  listingCommentMaxLength,
  omitListingNote,
  type ListingNote,
  type ListingNotesById,
} from "./listingNotes";

export interface ListingNoteRow {
  listing_id: string;
  comment: string;
  is_highlighted: boolean;
  is_rejected: boolean;
  is_contacted: boolean;
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

function isNoteRow(value: unknown): value is ListingNoteRow {
  const isObject = typeof value === "object";
  const isNotNull = value !== null;
  if (!isObject || !isNotNull) {
    return false;
  }

  const row = value as ListingNoteRow;
  return typeof row.listing_id === "string";
}

export function toListingNoteRow(listingId: string, note: ListingNote): ListingNoteRow {
  return {
    listing_id: listingId,
    comment: note.comment.slice(0, listingCommentMaxLength),
    is_highlighted: note.isHighlighted,
    is_rejected: note.isRejected,
    is_contacted: note.isContacted,
  };
}

export function noteFromRemoteRow(value: unknown): ListingNote | null {
  const isRow = isNoteRow(value);
  if (!isRow) {
    return null;
  }

  const note: ListingNote = {
    comment: readComment(value.comment),
    isHighlighted: readFlag(value.is_highlighted),
    isRejected: readFlag(value.is_rejected),
    isContacted: readFlag(value.is_contacted),
  };

  const isEmpty = isEmptyListingNote(note);
  if (isEmpty) {
    return null;
  }

  return note;
}

function notesFromRows(value: unknown): ListingNotesById {
  const isArray = Array.isArray(value);
  if (!isArray) {
    return {};
  }

  const notes: ListingNotesById = {};

  for (const item of value) {
    const isRow = isNoteRow(item);
    if (!isRow) {
      continue;
    }

    const note = noteFromRemoteRow(item);
    if (!note) {
      continue;
    }

    notes[item.listing_id] = note;
  }

  return notes;
}

export function mergeRemoteNotes(
  remoteNotes: ListingNotesById,
  currentNotes: ListingNotesById,
  pendingIds: ReadonlySet<string>,
): ListingNotesById {
  const merged: ListingNotesById = { ...remoteNotes };

  for (const listingId of pendingIds) {
    const pendingNote = currentNotes[listingId];
    const hasPendingNote = Boolean(pendingNote);
    if (!hasPendingNote) {
      delete merged[listingId];
      continue;
    }

    merged[listingId] = pendingNote;
  }

  return merged;
}

interface RemoteListingNoteChange {
  eventType: string;
  new: unknown;
  old: { listing_id?: string };
}

function readRecordId(value: unknown): string | null {
  const isRow = isNoteRow(value);
  if (!isRow) {
    return null;
  }

  const hasId = value.listing_id.length > 0;
  if (!hasId) {
    return null;
  }

  return value.listing_id;
}

function readChangeListingId(payload: RemoteListingNoteChange): string | null {
  const isDelete = payload.eventType === "DELETE";
  if (isDelete) {
    return readRecordId(payload.old);
  }

  return readRecordId(payload.new);
}

export function applyRemoteListingNoteChange(
  current: ListingNotesById,
  payload: RemoteListingNoteChange,
  pendingIds: ReadonlySet<string>,
): ListingNotesById {
  const listingId = readChangeListingId(payload);
  if (!listingId) {
    return current;
  }

  const isPending = pendingIds.has(listingId);
  if (isPending) {
    return current;
  }

  const isDelete = payload.eventType === "DELETE";
  if (isDelete) {
    return omitListingNote(current, listingId);
  }

  const note = noteFromRemoteRow(payload.new);
  if (!note) {
    return omitListingNote(current, listingId);
  }

  return {
    ...current,
    [listingId]: note,
  };
}

export async function fetchListingNotes(client: SupabaseClient): Promise<ListingNotesById> {
  const { data, error } = await client
    .from("listing_notes")
    .select("listing_id, comment, is_highlighted, is_rejected, is_contacted");

  if (error) {
    throw error;
  }

  return notesFromRows(data);
}

export async function uploadListingNotes(client: SupabaseClient, notes: ListingNotesById): Promise<void> {
  const rows = Object.keys(notes).map(function toRow(listingId) {
    return toListingNoteRow(listingId, notes[listingId]);
  });
  const hasRows = rows.length > 0;
  if (!hasRows) {
    return;
  }

  const { error } = await client.from("listing_notes").upsert(rows);
  if (error) {
    throw error;
  }
}

export async function persistRemoteListingNote(
  client: SupabaseClient,
  listingId: string,
  note: ListingNote,
): Promise<void> {
  const isEmpty = isEmptyListingNote(note);
  if (isEmpty) {
    const { error } = await client.from("listing_notes").delete().eq("listing_id", listingId);
    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await client.from("listing_notes").upsert(toListingNoteRow(listingId, note));
  if (error) {
    throw error;
  }
}
