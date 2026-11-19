import { notifySaved } from "./saveNotice";
import { getListingNotesClient } from "./supabaseClient";
import { visitorRequestHeaders } from "./visitorName";
import { isOlxListingUrl } from "./olxUrl";
import { parseOlxListing } from "./parseOlxListing";
import type { Listing } from "../types";

async function fetchOlxHtml(pageUrl: string): Promise<string> {
  const isDevServer = import.meta.env.DEV;
  if (isDevServer) {
    const response = await fetch(`/api/olx-listing?url=${encodeURIComponent(pageUrl)}`, {
      headers: visitorRequestHeaders(),
    });
    const isOk = response.ok;
    if (!isOk) {
      throw new Error("Nie udało się pobrać ogłoszenia z OLX.");
    }

    return response.text();
  }

  const client = getListingNotesClient();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasProxy = Boolean(client) && Boolean(supabaseUrl) && Boolean(supabaseAnonKey);
  if (!hasProxy || !supabaseUrl || !supabaseAnonKey) {
    throw new Error("Brak połączenia, które może pobrać stronę OLX.");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/import-olx-listing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      ...visitorRequestHeaders(),
    },
    body: JSON.stringify({ url: pageUrl }),
  });
  const isOk = response.ok;
  if (!isOk) {
    throw new Error("Nie udało się pobrać ogłoszenia z OLX.");
  }

  notifySaved();
  return response.text();
}

export async function importOlxListing(pageUrl: string): Promise<Listing> {
  const trimmedUrl = pageUrl.trim();
  const isOlxPage = isOlxListingUrl(trimmedUrl);
  if (!isOlxPage) {
    throw new Error("Wklej pełny link do ogłoszenia na OLX.");
  }

  const html = await fetchOlxHtml(trimmedUrl);
  const listing = parseOlxListing(html, trimmedUrl);
  if (!listing) {
    throw new Error("OLX nie oddało danych tego ogłoszenia.");
  }

  return listing;
}
