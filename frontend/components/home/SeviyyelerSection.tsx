import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";

/**
 * "Səviyyələr" section (`#seviyyeler`): 4 descriptive tier cards, no
 * pricing, no CTA — purely static copy, server component.
 */
export async function SeviyyelerSection() {
  const t = await getTranslations("home.seviyyeler");

  const tiers = [
    { title: t("standartTitle"), desc: t("standartDesc") },
    { title: t("proTitle"), desc: t("proDesc") },
    { title: t("elitTitle"), desc: t("elitDesc") },
    { title: t("prinsipialTitle"), desc: t("prinsipialDesc") },
  ];

  return (
    <section id="seviyyeler" className="bg-surface py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.title}
              className="rounded-xl border border-brand-dark/10 bg-white p-6"
            >
              <h3 className="font-semibold">{tier.title}</h3>
              <p className="mt-2 text-sm text-muted">{tier.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
