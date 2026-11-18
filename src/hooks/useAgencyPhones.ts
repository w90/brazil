import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getListingNotesClient } from "../domain/supabaseClient";

const storageKey = "brazil.agency-phones";

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object";
  const isNotNull = value !== null;
  return isObject && isNotNull;
}

function readPhoneText(value: unknown): string {
  const isText = typeof value === "string";
  if (!isText) {
    return "";
  }

  return value.trim();
}

function sanitizePhoneText(value: unknown): Record<string, string> {
  const isMap = isRecord(value);
  if (!isMap) {
    return {};
  }

  const phones: Record<string, string> = {};

  for (const seller of Object.keys(value)) {
    const phoneText = readPhoneText(value[seller]);
    const hasPhone = phoneText.length > 0;
    if (hasPhone) {
      phones[seller] = phoneText;
    }
  }

  return phones;
}

function loadPhoneText(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }

    return sanitizePhoneText(JSON.parse(raw));
  } catch {
    return {};
  }
}

function savePhoneText(phoneTextBySeller: Record<string, string>): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(phoneTextBySeller));
  } catch {
    return;
  }
}

export function useAgencyPhones() {
  const [phoneTextBySeller, setPhoneTextBySeller] = useState<Record<string, string>>(loadPhoneText);
  const [isPhonesSaveFailed, setIsPhonesSaveFailed] = useState(false);

  useEffect(
    function persistAgencyPhonesLocally() {
      savePhoneText(phoneTextBySeller);
    },
    [phoneTextBySeller],
  );

  useEffect(
    function loadRemoteAgencyPhones() {
      const client = getListingNotesClient();
      if (!client) {
        return;
      }

      let isCancelled = false;

      async function loadPhones(remoteClient: SupabaseClient) {
        const { data, error } = await remoteClient.from("agency_phones").select("seller, phone");
        if (isCancelled) {
          return;
        }

        const hasFailed = Boolean(error) || !Array.isArray(data);
        if (hasFailed) {
          setIsPhonesSaveFailed(true);
          return;
        }

        const remotePhones: Record<string, string> = {};

        for (const row of data) {
          const isRow = isRecord(row);
          if (!isRow || typeof row.seller !== "string") {
            continue;
          }

          const phoneText = readPhoneText(row.phone);
          const hasPhone = phoneText.length > 0;
          if (hasPhone) {
            remotePhones[row.seller] = phoneText;
          }
        }

        const remoteCount = Object.keys(remotePhones).length;
        const localPhones = loadPhoneText();
        const localCount = Object.keys(localPhones).length;
        const shouldUploadLocal = remoteCount === 0 && localCount > 0;
        if (shouldUploadLocal) {
          const rows = Object.keys(localPhones).map(function toRow(seller) {
            return { seller, phone: localPhones[seller] };
          });
          const { error: uploadError } = await remoteClient.from("agency_phones").upsert(rows);
          if (uploadError) {
            setIsPhonesSaveFailed(true);
            return;
          }

          setIsPhonesSaveFailed(false);
          return;
        }

        setPhoneTextBySeller(function mergePhones(current) {
          return { ...remotePhones, ...current };
        });
        setIsPhonesSaveFailed(false);
      }

      void loadPhones(client);

      return function cancelPhoneLoad() {
        isCancelled = true;
      };
    },
    [],
  );

  function handlePhoneChange(sellerKey: string, phoneText: string) {
    const nextText = phoneText.trim();
    const shouldRemove = nextText.length === 0;

    setPhoneTextBySeller(function replacePhone(current) {
      const nextPhones = { ...current };
      if (shouldRemove) {
        delete nextPhones[sellerKey];
        return nextPhones;
      }

      nextPhones[sellerKey] = nextText;
      return nextPhones;
    });

    const client = getListingNotesClient();
    if (!client) {
      return;
    }

    async function savePhone(remoteClient: SupabaseClient) {
      if (shouldRemove) {
        const { error } = await remoteClient.from("agency_phones").delete().eq("seller", sellerKey);
        if (error) {
          setIsPhonesSaveFailed(true);
          return;
        }

        setIsPhonesSaveFailed(false);
        return;
      }

      const { error } = await remoteClient.from("agency_phones").upsert({ seller: sellerKey, phone: nextText });
      if (error) {
        setIsPhonesSaveFailed(true);
        return;
      }

      setIsPhonesSaveFailed(false);
    }

    void savePhone(client);
  }

  return {
    phoneTextBySeller,
    handlePhoneChange,
    isPhonesSaveFailed,
  };
}
