import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

/**
 * This project is Azerbaijani-only for now. The locale machinery is
 * still wired through next-intl (cookie-based, NOT path-prefixed — URLs
 * stay `/qeydiyyat`, never `/az/qeydiyyat`) so that adding a second
 * locale later is a matter of adding it to SUPPORTED_LOCALES and a new
 * messages file, not restructuring routing.
 */
export const SUPPORTED_LOCALES = ["az"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "az";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)
      ? (cookieLocale as SupportedLocale)
      : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
