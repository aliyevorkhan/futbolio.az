"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicSettings } from "@/lib/api/settings";

/**
 * Single shared source of truth for public settings (WhatsApp number,
 * phone number, social links, video cards, FAQ). Every component that
 * needs any of these values — header CTA, hero, xidmetler cards, nece
 * isleyir, footer — must call this hook rather than hardcoding its own
 * copy of the value, so there is exactly one place the data is fetched.
 */
export function useSettingsQuery() {
  return useQuery({
    queryKey: ["public-settings"],
    queryFn: getPublicSettings,
  });
}
