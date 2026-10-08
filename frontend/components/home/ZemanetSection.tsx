import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";

/**
 * "Zəmanət" section (`#zemanet`): 3 bullet points + a highlighted
 * money-back card. Static copy, server component.
 */
export async function ZemanetSection() {
  const t = await getTranslations("home.zemanet");

  const points = [t("point1"), t("point2"), t("point3")];

  return (
    <section id="zemanet" className="bg-surface py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-muted">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-green"
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-brand-green p-8 text-brand-dark">
          <p className="text-2xl font-bold">{t("moneyBackTitle")}</p>
          <p className="mt-2 text-sm">{t("moneyBackDesc")}</p>
        </div>
      </Container>
    </section>
  );
}
