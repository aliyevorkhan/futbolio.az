"use client";

import { useTranslations } from "next-intl";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { useRoleOptions } from "@/lib/hooks/useRoleOptions";
import { buildWhatsAppUrl } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { ExternalLink } from "@/components/shared/ExternalLink";
import { RoleIcon } from "@/components/shared/RoleIcon";

/**
 * "Xidmətlər" section (`#xidmetler`): 5 service cards (now including
 * "Rəqib komanda"). Client component because each card's WhatsApp link
 * is sourced from `useSettingsQuery()`'s shared `whatsapp_number`, and
 * each card carries its own distinct message — never the generic
 * default text. The whole card is clickable, not just the pill.
 *
 * Default state: every card is white. Hover: only the hovered card
 * turns green and lifts — handled with pure CSS (`group`/`hover:`), no
 * JS state, so exactly one card can ever be green at a time.
 */
export function XidmetlerSection() {
  const t = useTranslations("home.xidmetler");
  const { data: settings } = useSettingsQuery();
  const roles = useRoleOptions();

  return (
    <section id="xidmetler" className="bg-surface py-14 lg:py-[110px]">
      <Container>
        <p className="text-[15px] font-semibold text-brand-green lg:text-lg">{t("eyebrow")}</p>
        <h2 className="mt-2.5 font-heading text-[34px] font-bold leading-[1.1] tracking-[-1.2px] text-foreground lg:mt-3 lg:text-[56px] lg:tracking-[-2px]">
          {t("title")}
        </h2>
        <p className="mt-3 text-base leading-[1.55] text-muted lg:text-xl">{t("description")}</p>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-12 lg:grid-cols-5 lg:gap-5">
          {roles.map((role) => {
            const whatsappUrl = settings ? buildWhatsAppUrl(settings.whatsapp_number, role.message) : undefined;
            const cardContent = (
              <>
                <span className="col-start-1 row-span-2 row-start-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-mint transition-colors duration-200 group-hover:bg-white lg:col-auto lg:row-auto lg:h-14 lg:w-14">
                  <RoleIcon role={role.key} className="h-[22px] w-[22px] text-foreground lg:h-[26px] lg:w-[26px]" />
                </span>
                <h3 className="col-start-2 row-start-1 mt-0 font-heading text-[17px] font-semibold leading-tight text-foreground lg:col-auto lg:row-auto lg:mt-[18px] lg:text-[23px]">
                  {role.label}
                </h3>
                <p className="col-start-2 row-start-2 text-[13.5px] leading-[1.45] text-muted transition-colors duration-200 group-hover:text-foreground lg:col-auto lg:row-auto lg:mt-2 lg:flex-1 lg:text-base">
                  {role.desc}
                </p>
                <span
                  aria-hidden="true"
                  className="col-start-3 row-span-2 row-start-1 flex h-11 w-11 items-center justify-center self-center justify-self-end rounded-full bg-brand-dark text-white transition-colors duration-200 group-hover:bg-brand-dark lg:col-auto lg:row-auto lg:mt-[18px] lg:h-12 lg:w-fit lg:min-w-[110px] lg:self-start lg:justify-self-start lg:rounded-full lg:px-[22px] lg:text-base lg:font-bold"
                >
                  <svg className="h-[9px] w-[9px] lg:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                  <span className="hidden lg:inline">{t("orderCta")}</span>
                </span>
              </>
            );

            const className =
              "group grid cursor-pointer grid-cols-[48px_1fr_44px] items-center gap-x-3.5 rounded-[22px] bg-white p-4 no-underline transition-all duration-200 hover:bg-brand-green hover:shadow-[0_18px_40px_rgba(10,20,16,0.12)] focus-visible:bg-brand-green focus-visible:outline-none lg:flex lg:flex-col lg:items-start lg:rounded-[28px] lg:p-[30px] lg:hover:-translate-y-1";

            if (!whatsappUrl) {
              return (
                <div key={role.key} className={className}>
                  {cardContent}
                </div>
              );
            }
            return (
              <ExternalLink
                key={role.key}
                href={whatsappUrl}
                analyticsLabel={`xidmetler_order_${role.key}`}
                className={className}
              >
                {cardContent}
              </ExternalLink>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
