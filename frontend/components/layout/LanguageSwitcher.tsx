"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<AppLocale, string> = {
  az: "AZ",
  ru: "RU",
  en: "EN",
};

/**
 * AZ/RU/EN pills. `usePathname()`/`Link` here are the locale-aware
 * versions from `i18n/routing.ts` — `pathname` is already locale-stripped
 * (e.g. `/qeydiyyat` regardless of current locale), so passing it as
 * `href` with a `locale` override preserves the current page across a
 * language switch with zero manual path math.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const activeLocale = useLocale();
  const pathname = usePathname();

  return (
    <div className={cn("flex items-center gap-1", className)} role="group" aria-label="Dil">
      {routing.locales.map((locale) => {
        const isActive = locale === activeLocale;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2",
              isActive
                ? "bg-brand-dark text-white"
                : "text-muted hover:bg-brand-dark/5 hover:text-foreground",
            )}
          >
            {LOCALE_LABELS[locale]}
          </Link>
        );
      })}
    </div>
  );
}
