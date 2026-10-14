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
    <section id="biz" className="bg-white py-12 lg:py-[72px]">
      <Container className="lg:grid lg:grid-cols-2 lg:items-end lg:gap-20">
        <div className="max-w-[620px]">
          <p className="text-sm font-semibold text-brand-green">{t("eyebrow")}</p>
          <h2 className="mt-2.5 font-heading text-[28px] font-bold leading-[1.15] tracking-[-1.5px] text-foreground lg:mt-3 lg:text-[40px]">
            {t("title")}
          </h2>
        </div>
        <p className="mt-3.5 text-[15px] leading-[1.6] text-muted lg:mt-0 lg:max-w-[520px] lg:text-[17px]">{t("description")}</p>

        <div className="mt-7 grid gap-5 lg:col-span-2 lg:mt-10 lg:grid-cols-2 lg:items-center">
          <div className="rounded-[24px] bg-surface p-5 lg:px-8 lg:py-7">
            <span className="mb-[18px] inline-block rounded-full bg-white px-3 py-[5px] text-[13px] font-bold text-muted">
              {t("noBadge")}
            </span>
            {NO_ITEMS.map((key, index) => (
              <div
                key={key}
                className={`flex items-center gap-3 py-[11px] text-[14.5px] font-medium text-muted lg:text-base ${
                  index > 0 ? "border-t border-brand-dark/[0.08]" : ""
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white lg:h-[26px] lg:w-[26px]">
                  <XIcon />
                </span>
                {t(key)}
              </div>
            ))}
          </div>

          <div className="-rotate-1 rounded-[24px] bg-brand-green p-5 shadow-[0_20px_40px_-20px_rgba(10,20,16,0.2)] lg:px-8 lg:py-7">
            <span className="mb-[18px] inline-block rounded-full bg-brand-dark px-3 py-[5px] text-[13px] font-bold text-white">
              {t("yesBadge")}
            </span>
            {YES_ITEMS.map((key, index) => (
              <div
                key={key}
                className={`flex items-center gap-3 py-[11px] text-[14.5px] font-semibold text-foreground lg:text-base ${
                  index > 0 ? "border-t border-brand-dark/[0.08]" : ""
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white lg:h-[26px] lg:w-[26px]">
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
