"use client";

import { useTranslations } from "next-intl";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { buildFaqPageJsonLd } from "@/lib/jsonld";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { JsonLdScript } from "@/components/shared/JsonLdScript";
import { Accordion } from "@/components/ui/accordion";
import { AccordionFaqItem } from "@/components/shared/AccordionItem";

/**
 * "Suallar" / FAQ section (`#suallar`). Renders whatever `faq` array
 * comes back from the settings API (don't hardcode a count) as a
 * keyboard-operable accordion, first item open by default, and emits
 * FAQPage JSON-LD built from that exact same array.
 */
export function SuallarSection() {
  const t = useTranslations("home.suallar");
  const { data: settings } = useSettingsQuery();

  const faq = settings?.faq ?? [];

  if (faq.length === 0) {
    return (
      <section id="suallar" className="py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        </Container>
      </section>
    );
  }

  return (
    <section id="suallar" className="py-16 sm:py-24">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <Accordion
          type="single"
          collapsible
          defaultValue={String(faq[0].id)}
          className="mt-8"
        >
          {faq.map((item) => (
            <AccordionFaqItem
              key={item.id}
              value={String(item.id)}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </Accordion>

        <JsonLdScript data={buildFaqPageJsonLd(faq)} />
      </Container>
    </section>
  );
}
