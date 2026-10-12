"use client";

import { useTranslations } from "next-intl";
import type { RoleKey } from "@/components/shared/RoleIcon";

export const ROLE_KEYS: RoleKey[] = ["futbolcu", "qapici", "hakim", "hekim", "reqib"];

export interface RoleOption {
  key: RoleKey;
  label: string;
  desc: string;
  message: string;
}

/**
 * The 5 "who do you need" entries (hero role menu + Xidmətlər cards),
 * sourced from `home.xidmetler` so the label/description/WhatsApp
 * message is defined in exactly one place.
 */
export function useRoleOptions(): RoleOption[] {
  const t = useTranslations("home.xidmetler");
  return ROLE_KEYS.map((key) => ({
    key,
    label: t(`${key}.title`),
    desc: t(`${key}.desc`),
    message: t(`${key}.whatsappMessage`),
  }));
}
