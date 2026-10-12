"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { buildWhatsAppUrl } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { ExternalLink } from "@/components/shared/ExternalLink";
import { Button } from "@/components/ui/button";
import { HeroIllustration } from "@/components/home/HeroIllustration";

const CHECKLIST_KEYS = [
  "checklistPlayers",
  "checklistGoalkeepers",
  "checklistReferees",
  "checklistMedics",
] as const;

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
          <span className="inline-flex items-center rounded-full bg-brand-green/15 px-3 py-1 text-xs font-semibold text-brand-dark">
            {t("badge")}
          </span>

          {/* Split into 3 keys so only "12-ci oyunçusu" is wrapped in the
              highlight span — word order differs by language, so this
              must never be a runtime split of one translated sentence. */}
          <h1
            className="mt-4 font-heading font-extrabold leading-[1.2] tracking-tight"
            style={{ fontSize: "clamp(1.875rem, 1.3rem + 2.2vw, 3rem)" }}
          >
            {t("titlePrefix")}
            <span className="rounded bg-brand-green px-1.5 py-0.5 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
              {t("titleHighlight")}
            </span>
            {t("titleSuffix")}
          </h1>

          <p className="mt-5 max-w-lg text-base leading-[1.5] text-muted sm:text-lg">
            {t("subtitle")}
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-foreground">
            {CHECKLIST_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-brand-green" aria-hidden="true" />
                {t(key)}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            {whatsappUrl ? (
              <ExternalLink
                href={whatsappUrl}
                analyticsLabel="hero_find_player"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-green px-5 text-sm font-semibold text-brand-dark transition-colors duration-150 hover:bg-brand-green/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
              >
                {t("findPlayerCta")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ExternalLink>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/qeydiyyat">{t("joinCta")}</Link>
            </Button>
          </div>
        </div>

        <HeroIllustration />
      </Container>
    </section>
  );
}
