import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";

const NO_ITEMS = ["noItem1", "noItem2", "noItem3", "noItem4"] as const;
const YES_ITEMS = ["yesItem1", "yesItem2", "yesItem3", "yesItem4"] as const;

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9AA3A0" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0A1410" strokeWidth="2.6" aria-hidden="true">
      <polyline points="4,12 10,18 20,6" />
    </svg>
  );
}

/**
 * "Biz kimik" section (`#biz`). Replaces the old 3-benefit-card layout
 * with a "Futbolio olmadan / Futbolio ilə" (without/with) comparison —
 * purely static copy, server component. Custom heading markup (not the
 * shared `SectionHeading`) since this section's type scale (34px/52px,
 * normal-case eyebrow) differs from every other section's, and
 * `SectionHeading` stays untouched for the sections that still use it.
 */
export async function BizKimikSection() {
  const t = await getTranslations("home.biz");

  return (
    <section id="biz" className="bg-white py-14 lg:py-[110px]">
      <Container className="lg:grid lg:grid-cols-2 lg:items-end lg:gap-20">
        <div>
          <p className="text-[15px] font-semibold text-brand-green lg:text-lg">{t("eyebrow")}</p>
          <h2 className="mt-2.5 font-heading text-[34px] font-bold leading-[1.1] tracking-[-1.2px] text-foreground lg:mt-3 lg:text-[52px] lg:tracking-[-2px]">
            {t("title")}
          </h2>
        </div>
        <p className="mt-3.5 text-base leading-[1.6] text-muted lg:mt-0 lg:text-xl">{t("description")}</p>

        <div className="mt-8 grid gap-3.5 lg:col-span-2 lg:mt-14 lg:grid-cols-2 lg:items-center lg:gap-7">
          <div className="rounded-[28px] bg-surface p-6 lg:px-10 lg:py-9">
            <span className="mb-[18px] inline-block rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-muted lg:text-[15px]">
              {t("noBadge")}
            </span>
            {NO_ITEMS.map((key, index) => (
              <div
                key={key}
                className={`flex items-center gap-3 py-[13px] text-base font-medium text-muted lg:py-4 lg:text-lg ${
                  index > 0 ? "border-t border-brand-dark/[0.08]" : ""
                }`}
              >
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white">
                  <XIcon />
                </span>
                {t(key)}
              </div>
            ))}
          </div>

          <div className="-rotate-[1.5deg] rounded-[28px] bg-brand-green p-6 shadow-[0_30px_60px_-25px_rgba(10,20,16,0.35)] lg:px-10 lg:py-9">
            <span className="mb-[18px] inline-block rounded-full bg-brand-dark px-3.5 py-1.5 text-sm font-bold text-white lg:text-[15px]">
              {t("yesBadge")}
            </span>
            {YES_ITEMS.map((key, index) => (
              <div
                key={key}
                className={`flex items-center gap-3 py-[13px] text-base font-semibold text-foreground lg:py-4 lg:text-lg ${
                  index > 0 ? "border-t border-brand-dark/[0.08]" : ""
                }`}
              >
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white">
                  <CheckIcon />
                </span>
                {t(key)}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
