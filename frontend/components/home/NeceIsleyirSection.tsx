"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { buildWhatsAppUrl } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ExternalLink } from "@/components/shared/ExternalLink";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Centralized here AND in SeviyyelerSection.tsx via the shared
// `home.tiers` i18n namespace, so the 4 tier names never drift between
// the two sections.
const TIER_KEYS = ["standart", "pro", "elit", "prinsipial"] as const;

/**
 * "Necə işləyir" section (`#nece`): full-bleed green band, 3 steps each
 * with a small static "preview chip", + a WhatsApp CTA next to the
 * heading. Sourced from the shared `useSettingsQuery()` result.
 */
export function NeceIsleyirSection() {
  const t = useTranslations("home.nece");
  const tTiers = useTranslations("home.tiers");
  const { data: settings } = useSettingsQuery();

  const whatsappUrl = settings
    ? buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_default_text)
    : undefined;

  const steps = [
    { title: t("step1Title"), desc: t("step1Desc") },
    { title: t("step2Title"), desc: t("step2Desc") },
    { title: t("step3Title"), desc: t("step3Desc") },
  ];

  return (
    <section id="nece" className="bg-brand-green py-16 text-brand-dark sm:py-24">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            eyebrowClassName="text-brand-dark/70"
          />
          {whatsappUrl ? (
            <ExternalLink
              href={whatsappUrl}
              analyticsLabel="nece_cta"
              className={cn(buttonVariants({ variant: "dark-solid" }), "shrink-0")}
            >
              {t("cta")}
            </ExternalLink>
          ) : null}
        </div>

        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col rounded-xl bg-white p-6 text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-brand-dark">
                {index + 1}
              </span>
              <h3 className="mt-4 font-heading font-semibold">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{step.desc}</p>

              {index === 0 ? (
                <span className="mt-4 inline-flex w-fit items-center rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-foreground">
                  {t("previewSlot")}
                </span>
              ) : null}

              {index === 1 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {TIER_KEYS.map((key) => (
                    <span
                      key={key}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        key === "pro"
                          ? "bg-brand-green text-brand-dark"
                          : "bg-surface text-foreground",
                      )}
                    >
                      {tTiers(key)}
                    </span>
                  ))}
                </div>
              ) : null}

              {index === 2 ? (
                <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-foreground">
                  <Check className="h-3.5 w-3.5 text-brand-green" aria-hidden="true" />
                  {t("previewConfirmed")}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
