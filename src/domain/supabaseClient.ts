import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { notifySaved } from "./saveNotice";
import { readVisitorName } from "./visitorName";

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

async function visitorFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  const visitorName = readVisitorName();
  if (visitorName) {
    headers.set("x-visitor-name", visitorName);
  }

  const methodSource = init?.method ?? (input instanceof Request ? input.method : "GET");
  const method = methodSource.toUpperCase();
  const response = await fetch(input, { ...init, headers });
  const isWrite = method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";
  if (response.ok && isWrite) {
    notifySaved();
  }

  return response;
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
    listingNotesClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: visitorFetch,
      },
    });
  } catch {
    return null;
  }

  return listingNotesClient;
}
