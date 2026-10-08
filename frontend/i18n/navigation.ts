import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

/**
 * Locale-aware `Link`/`usePathname`/`useRouter`/`redirect`/`getPathname` —
 * use these everywhere in marketing React components instead of
 * `next/link`/`next/navigation`, so nav links automatically carry the
 * right locale prefix. Kept separate from `i18n/routing.ts` (plain config,
 * safe in non-React contexts like `middleware.ts`/`sitemap.ts`) since
 * `createNavigation` pulls in React-bound hooks.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
