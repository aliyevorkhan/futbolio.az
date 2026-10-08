import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";

/**
 * "Biz kimik" section (`#biz`). Purely static marketing copy — no
 * settings data needed, so this stays a server component. Two-column:
 * heading left, description + the 3 benefit cards (in a row) right.
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
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <div>
          <p className="text-base leading-[1.5] text-muted">{t("description")}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-xl bg-surface p-5">
                <span
                  className="mb-3 block h-2 w-2 rounded-full bg-brand-green"
                  aria-hidden="true"
                />
                <h3 className="font-heading font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
