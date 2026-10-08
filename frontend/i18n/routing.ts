import { defineRouting } from "next-intl/routing";

/**
 * Single source of truth for locale-aware routing config. Kept separate
 * from `i18n/navigation.ts` (the `Link`/`usePathname`/etc. exports) on
 * purpose — this file is imported from non-React contexts too (metadata
 * routes like `sitemap.ts`, `middleware.ts`), and `createNavigation`'s
 * React-bound hooks aren't safe to pull into those bundles.
 *
 * `localePrefix: "as-needed"` means the default locale (az) stays
 * un-prefixed (`/qeydiyyat`) while ru/en get a prefix
 * (`/ru/qeydiyyat`, `/en/qeydiyyat`) — this preserves every existing AZ
 * URL exactly as it was before i18n existed.
 */
export const routing = defineRouting({
  locales: ["az", "ru", "en"],
  defaultLocale: "az",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
