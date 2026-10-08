import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { cn } from "@/lib/utils";

/**
 * "Zəmanət" section (`#zemanet`): numbered (01/02/03) rows with divider
 * lines between them, + a tilted money-back card. Static copy, server
 * component.
 */
export async function ZemanetSection() {
  const t = await getTranslations("home.zemanet");

  const points = [t("point1"), t("point2"), t("point3")];

  return (
    <section id="zemanet" className="bg-surface py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
          <ol className="mt-6">
            {points.map((point, index) => (
              <li
                key={point}
                className={cn(
                  "flex items-start gap-4 py-4 text-sm text-muted",
                  index < points.length - 1 && "border-b border-brand-dark/10",
                )}
              >
                <span className="shrink-0 font-heading text-sm font-bold text-brand-green">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {point}
              </li>
            ))}
          </ol>
        </div>

        <div className="rotate-2 rounded-xl bg-brand-green p-8 text-brand-dark">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-dark/70">
            {t("badgeLabel")}
          </p>
          <p className="mt-3 font-heading text-6xl font-extrabold">100%</p>
          <p className="mt-2 text-lg font-semibold">{t("moneyBackSubline")}</p>
          <p className="mt-3 text-sm text-brand-dark/80">{t("moneyBackDesc")}</p>
        </div>
      </Container>
    </section>
  );
}
