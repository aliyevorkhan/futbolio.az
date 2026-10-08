"use client";

import { useTranslations } from "next-intl";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { buildWhatsAppUrl } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ExternalLink } from "@/components/shared/ExternalLink";

/**
 * "Necə işləyir" section (`#nece`): 3 steps + a WhatsApp CTA, sourced
 * from the shared `useSettingsQuery()` result.
 */
export function NeceIsleyirSection() {
  const t = useTranslations("home.nece");
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
    <section id="nece" className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-xl border border-brand-dark/10 p-6"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-brand-dark">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.desc}</p>
            </li>
          ))}
        </ol>

        {whatsappUrl ? (
          <div className="mt-8">
            <ExternalLink
              href={whatsappUrl}
              analyticsLabel="nece_cta"
              className="inline-flex h-11 items-center justify-center rounded-full bg-brand-green px-5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-green/90"
            >
              {t("cta")}
            </ExternalLink>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
