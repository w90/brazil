import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let listingNotesClient: SupabaseClient | null = null;

function readEnvValue(value: unknown): string | null {
  const isText = typeof value === "string";
  if (!isText) {
    return null;
  }

  const trimmed = value.trim();
  const hasValue = trimmed.length > 0;
  if (!hasValue) {
    return null;
  }

  return trimmed;
}

export function getListingNotesClient(): SupabaseClient | null {
  if (listingNotesClient) {
    return listingNotesClient;
  }

  const supabaseUrl = readEnvValue(import.meta.env.VITE_SUPABASE_URL);
  const supabaseAnonKey = readEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);
  const hasConfig = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);
  if (!hasConfig || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    listingNotesClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    return null;
  }

  return listingNotesClient;
}
