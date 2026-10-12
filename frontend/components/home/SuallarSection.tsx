import { getTranslations } from "next-intl/server";
import { buildFaqPageJsonLd } from "@/lib/jsonld";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { JsonLdScript } from "@/components/shared/JsonLdScript";
import { Accordion } from "@/components/ui/accordion";
import { AccordionFaqItem } from "@/components/shared/AccordionItem";

// Static per the owner's decision (not admin-editable DB content for
// this fix round) — discrete q1..q11 keys under home.suallar.items,
// following the same discrete-key convention XidmetlerSection already
// uses for its 4 service entries.
//
// TODO(owner-confirm): q5 ("Qiymət nə qədərdir?") and q11 ("Hansı
// ərazilərdə xidmət göstərirsiniz?") answers need the owner's explicit
// confirmation before launch — see messages/{az,ru,en}.json's
// home.suallar.items.q5 / .q11.
//
// q4 ("Bütöv rəqib komanda tapmaq olar?") was removed per the owner's
// request — the key stays in messages/*.json (unused) rather than
// renumbering every subsequent key.
const FAQ_KEYS = [
  "q1",
  "q2",
  "q3",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
] as const;

/**
 * "Suallar" / FAQ section (`#suallar`). Two-column: eyebrow/heading/
 * helper left, accordion right. Data source is static i18n content
 * (`useTranslations`), not the settings-query FAQ array, per the
 * owner's decision — FAQPage JSON-LD is built from that same static
 * array.
 */
export async function SuallarSection() {
  const t = await getTranslations("home.suallar");

  const faq = FAQ_KEYS.map((key) => ({
    id: key,
    question: t(`items.${key}.question`),
    answer: t(`items.${key}.answer`),
  }));

  return (
    <section id="suallar" className="py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,320px)_1fr]">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("helper")} />

        <div>
          <Accordion type="single" collapsible defaultValue={faq[0].id}>
            {faq.map((item) => (
              <AccordionFaqItem
                key={item.id}
                value={item.id}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </Accordion>
        </div>

        <JsonLdScript data={buildFaqPageJsonLd(faq)} />
      </Container>
    </section>
  );
}
