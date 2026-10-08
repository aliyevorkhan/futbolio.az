import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { cn } from "@/lib/utils";

// Shared with NeceIsleyirSection.tsx via the `home.tiers` i18n
// namespace, so the 4 tier names never drift between the two sections.
const TIER_KEYS = ["standart", "pro", "elit", "prinsipial"] as const;

/**
 * "Səviyyələr" section (`#seviyyeler`): 4 descriptive tier cards, no
 * pricing, no CTA — purely static copy, server component. 4th card
 * (Prinsipial) is highlighted green.
 */
export async function SeviyyelerSection() {
  const t = await getTranslations("home.seviyyeler");
  const tTiers = await getTranslations("home.tiers");

  return (
    <section id="seviyyeler" className="bg-surface py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIER_KEYS.map((key, index) => {
            const isLast = index === TIER_KEYS.length - 1;
            return (
              <div
                key={key}
                className={cn(
                  "rounded-xl p-6",
                  isLast ? "bg-brand-green text-brand-dark" : "border border-brand-dark/10 bg-white",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-bold",
                    isLast ? "text-brand-dark/50" : "text-brand-green",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-heading font-semibold">{tTiers(key)}</h3>
                <p className={cn("mt-2 text-sm", isLast ? "text-brand-dark/70" : "text-muted")}>
                  {t(`${key}Desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
