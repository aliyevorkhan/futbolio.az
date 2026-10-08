"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { buildWhatsAppUrl } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { ExternalLink } from "@/components/shared/ExternalLink";
import { Button } from "@/components/ui/button";

/**
 * Hero section (`#top`). Client component because it reads the
 * WhatsApp number/default text from `useSettingsQuery()` — the same
 * query every other section that needs a WhatsApp link also calls, so
 * there's exactly one network request and one source of truth.
 */
export function HeroSection() {
  const t = useTranslations("home.hero");
  const { data: settings } = useSettingsQuery();

  const whatsappUrl = settings
    ? buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_default_text)
    : undefined;

  return (
    <section id="top" className="bg-surface">
      <Container className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {whatsappUrl ? (
              <ExternalLink
                href={whatsappUrl}
                analyticsLabel="hero_find_player"
                className="inline-flex h-11 items-center justify-center rounded-full bg-brand-green px-5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-green/90"
              >
                {t("findPlayerCta")}
              </ExternalLink>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/qeydiyyat">{t("joinCta")}</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/pitch.svg"
            alt={t("illustrationAlt")}
            width={400}
            height={300}
            className="h-auto w-full"
          />
        </div>
      </Container>
    </section>
  );
}
