"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { Container } from "@/components/shared/Container";
import { ExternalLink } from "@/components/shared/ExternalLink";

/**
 * Site-wide thin bottom bar shown on every marketing page (home,
 * /qeydiyyat, /mexfilik, /haqqimizda). The rich contact CTA band
 * (phone/WhatsApp/Instagram direkt) lives only on the home page as
 * `components/home/ElaqeFooterSection.tsx` — this component stays the
 * minimal bottom bar so the two don't visually duplicate on `/`.
 *
 * Client component (not server, like before the fix round) because it
 * now also reads Instagram/TikTok from `useSettingsQuery()` on every
 * page, not just home — React Query dedupes the cache, so this adds no
 * extra network request.
 */
export function Footer() {
  const t = useTranslations("footer");
  const { data: settings } = useSettingsQuery();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-dark/10 bg-surface">
      <Container className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted sm:justify-start">
          <Link href="/" className="text-lg font-bold lowercase tracking-tight text-foreground">
            futbolio
          </Link>
          <Link
            href="/haqqimizda"
            className="rounded transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
          >
            {t("aboutLink")}
          </Link>
          <Link
            href="/qeydiyyat"
            className="rounded transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
          >
            {t("joinLink")}
          </Link>
          <Link
            href="/mexfilik"
            className="rounded transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
          >
            {t("privacyLink")}
          </Link>
          {settings?.instagram_url ? (
            <ExternalLink
              href={settings.instagram_url}
              analyticsLabel="site_footer_instagram"
              className="rounded transition-colors duration-150 hover:text-foreground"
            >
              {t("instagramLink")}
            </ExternalLink>
          ) : null}
          {settings?.tiktok_url ? (
            <ExternalLink
              href={settings.tiktok_url}
              analyticsLabel="site_footer_tiktok"
              className="rounded transition-colors duration-150 hover:text-foreground"
            >
              {t("tiktokLink")}
            </ExternalLink>
          ) : null}
        </div>
        <p className="text-sm text-muted-2">{t("locationLine", { year })}</p>
      </Container>
    </footer>
  );
}
