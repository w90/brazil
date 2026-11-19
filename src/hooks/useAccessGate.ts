import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getListingNotesClient } from "../domain/supabaseClient";
import { readStoredVisitorName, resolveVisitorName, storeVisitorName } from "../domain/visitorName";

export function useAccessGate() {
  const [visitorName, setVisitorName] = useState<string | null>(readStoredVisitorName);
  const isLocked = visitorName === null;
  const isReadOnly = false;

  useEffect(
    function syncVisitorName() {
      if (!visitorName) {
        return;
      }

      const client = getListingNotesClient();
      if (!client) {
        return;
      }

      let isCancelled = false;

      async function saveVisitor(remoteClient: SupabaseClient) {
        const { error } = await remoteClient.from("app_visitors").upsert({
          visitor_name: visitorName,
          updated_at: new Date().toISOString(),
        });
        if (isCancelled || error) {
          return;
        }
      }

      void saveVisitor(client);

      return function cancelVisitorSync() {
        isCancelled = true;
      };
    },
    [visitorName],
  );

  function handleUnlock(rawName: string): boolean {
    const identity = resolveVisitorName(rawName);
    if (!identity) {
      return false;
    }

    storeVisitorName(identity.name);
    setVisitorName(identity.name);
    return true;
  }

  return {
    isLocked,
    isReadOnly,
    visitorName: visitorName ?? "",
    handleUnlock,
  };
}
