import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { routing, type AppLocale } from "@/i18n/routing";

export const SUPPORTED_LOCALES = routing.locales;
export type SupportedLocale = AppLocale;
export const DEFAULT_LOCALE = routing.defaultLocale;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // `/admin/*` routes live OUTSIDE the `[locale]` segment (admin stays
  // Azerbaijani-only and un-prefixed), so `requestLocale` resolves to
  // undefined there — fall back to the default locale rather than 404ing,
  // so every existing admin `useTranslations()`/`getTranslations()` call
  // keeps working unchanged. A genuinely unsupported locale SEGMENT
  // (someone hitting `/fr/...`) still 404s via middleware before this
  // ever runs, so this fallback only ever fires for locale-less routes.
  if (requested && !SUPPORTED_LOCALES.includes(requested as SupportedLocale)) {
    notFound();
  }

  const locale = (requested as SupportedLocale) ?? DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
