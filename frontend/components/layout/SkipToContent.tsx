"use client";

import { useTranslations } from "next-intl";

/**
 * Visually-hidden-until-focused skip link for keyboard/screen-reader
 * users, so repeated header nav doesn't have to be tabbed through on
 * every page.
 */
export function SkipToContent() {
  const t = useTranslations("nav");

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-dark focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
    >
      {t("skipToContent")}
    </a>
  );
}
