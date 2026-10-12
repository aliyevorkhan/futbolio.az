import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";

// Shared with NeceIsleyirSection.tsx via the `home.tiers` i18n
// namespace, so the 4 tier names never drift between the two sections.
const TIER_KEYS = ["standart", "pro", "elit", "prinsipial"] as const;

/**
 * "Səviyyələr" section (`#seviyyeler`): 4 descriptive tier cards, no
 * pricing, no CTA — purely static copy, server component. Every card is
 * white by default; only the one currently under the pointer turns
 * green (pure CSS `:hover`, no JS state needed).
 */
export async function SeviyyelerSection() {
  const t = await getTranslations("home.seviyyeler");
  const tTiers = await getTranslations("home.tiers");

  return (
    <section id="seviyyeler" className="bg-surface py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIER_KEYS.map((key, index) => (
            <div
              key={key}
              className="group rounded-xl border border-brand-dark/10 bg-white p-6 transition-colors duration-200 hover:border-transparent hover:bg-brand-green hover:text-brand-dark"
            >
              <span className="text-sm font-bold text-brand-green transition-colors duration-200 group-hover:text-brand-dark/50">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-heading font-semibold">{tTiers(key)}</h3>
              <p className="mt-2 text-sm text-muted transition-colors duration-200 group-hover:text-brand-dark/70">
                {t(`${key}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
