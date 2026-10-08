"use client";

import { useTranslations } from "next-intl";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { buildWhatsAppUrl, formatPhone } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { ExternalLink } from "@/components/shared/ExternalLink";

/**
 * "Əlaqə" contact section (`#elaqe`) — the rich contact block with
 * phone/WhatsApp/Instagram/TikTok, all sourced from the shared
 * `useSettingsQuery()` result (never a hardcoded duplicate of any of
 * these values). This is the last content section on the home page,
 * distinct from the generic site-wide `components/layout/Footer.tsx`
 * that wraps every marketing page.
 */
export function ElaqeFooterSection() {
  const t = useTranslations("home.elaqe");
  const { data: settings } = useSettingsQuery();
  const year = new Date().getFullYear();

  if (!settings) {
    return (
      <section id="elaqe" className="bg-brand-dark py-16 text-white">
        <Container>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
        </Container>
      </section>
    );
  }

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    settings.whatsapp_default_text,
  );

  return (
    <section id="elaqe" className="bg-brand-dark py-16 text-white">
      <Container>
        <h2 className="text-2xl font-bold">{t("title")}</h2>

        <div className="mt-6 flex flex-wrap gap-3">
          <ExternalLink
            href={`tel:${settings.phone_number}`}
            analyticsLabel="footer_phone"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold hover:bg-white/10"
          >
            {formatPhone(settings.phone_number)}
          </ExternalLink>

          <ExternalLink
            href={whatsappUrl}
            analyticsLabel="footer_whatsapp"
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-green px-5 text-sm font-semibold text-brand-dark hover:bg-brand-green/90"
          >
            {t("whatsapp")}
          </ExternalLink>

          {settings.instagram_url ? (
            <ExternalLink
              href={settings.instagram_url}
              analyticsLabel="footer_instagram_profile"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold hover:bg-white/10"
            >
              {t("instagramProfile")}
            </ExternalLink>
          ) : null}

          {settings.instagram_dm_url ? (
            <ExternalLink
              href={settings.instagram_dm_url}
              analyticsLabel="footer_instagram_dm"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold hover:bg-white/10"
            >
              {t("instagramDm")}
            </ExternalLink>
          ) : null}

          {settings.tiktok_url ? (
            <ExternalLink
              href={settings.tiktok_url}
              analyticsLabel="footer_tiktok"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold hover:bg-white/10"
            >
              {t("tiktok")}
            </ExternalLink>
          ) : null}
        </div>

        <p className="mt-10 text-sm text-white/60">
          {t("copyright", { year })}
        </p>
      </Container>
    </section>
  );
}
