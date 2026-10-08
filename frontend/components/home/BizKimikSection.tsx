import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";

/**
 * "Biz kimik" section (`#biz`). Purely static marketing copy — no
 * settings data needed, so this stays a server component.
 */
export async function BizKimikSection() {
  const t = await getTranslations("home.biz");

  const benefits = [
    { title: t("benefit1Title"), desc: t("benefit1Desc") },
    { title: t("benefit2Title"), desc: t("benefit2Desc") },
    { title: t("benefit3Title"), desc: t("benefit3Desc") },
  ];

  return (
    <section id="biz" className="py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-xl border border-brand-dark/10 bg-white p-6"
            >
              <h3 className="font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm text-muted">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
