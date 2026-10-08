"use client";

import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { buildWhatsAppUrl, formatPhone } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { ExternalLink } from "@/components/shared/ExternalLink";

/**
 * "Əlaqə" CTA band (`#elaqe`) — big heading, standalone phone number,
 * WhatsApp + "Instagram direkt" pills, sourced from the shared
 * `useSettingsQuery()` result. The generic Instagram-profile/TikTok
 * pills and the copyright line moved to the site-wide
 * `components/layout/Footer.tsx` bottom bar, so this section stays
 * purely the CTA band.
 */
export function ElaqeFooterSection() {
  const t = useTranslations("home.elaqe");
  const { data: settings } = useSettingsQuery();

  if (!settings) {
    return (
      <section id="elaqe" className="bg-brand-dark py-16 text-white sm:py-24">
        <Container>
          <h2 className="font-heading text-4xl font-bold sm:text-5xl">{t("title")}</h2>
        </Container>
      </section>
    );
  }

  const whatsappUrl = buildWhatsAppUrl(
    settings.whatsapp_number,
    settings.whatsapp_default_text,
  );

  return (
    <section id="elaqe" className="bg-brand-dark py-16 text-white sm:py-24">
      <Container>
        <h2 className="font-heading text-4xl font-bold sm:text-5xl">{t("title")}</h2>

        <p className="mt-6 text-3xl font-bold text-brand-green sm:text-4xl">
          {formatPhone(settings.phone_number)}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <ExternalLink
            href={whatsappUrl}
            analyticsLabel="footer_whatsapp"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-green px-5 text-sm font-semibold text-brand-dark transition-colors duration-150 hover:bg-brand-green/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t("whatsapp")}
          </ExternalLink>

          {settings.instagram_dm_url ? (
            <ExternalLink
              href={settings.instagram_dm_url}
              analyticsLabel="footer_instagram_direkt"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/30 px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              {t("instagramDirekt")}
            </ExternalLink>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
