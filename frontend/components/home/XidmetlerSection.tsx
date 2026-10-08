"use client";

import { useTranslations } from "next-intl";
import { Goal, Hand, Flag, Stethoscope } from "lucide-react";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { buildWhatsAppUrl } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ExternalLink } from "@/components/shared/ExternalLink";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Icon picks verified against the installed lucide-react@0.451.0 export
// list: `Goal` (football goal → Futbolçu), `Hand` (goalkeeper catches
// with hands → Qapıçı), `Flag` (referee's flag → Hakim), `Stethoscope`
// (unambiguous → Həkim).
const SERVICE_ICONS = {
  futbolcu: Goal,
  qapici: Hand,
  hakim: Flag,
  hekim: Stethoscope,
} as const;

const SERVICE_KEYS = Object.keys(SERVICE_ICONS) as Array<keyof typeof SERVICE_ICONS>;

/**
 * "Xidmətlər" section (`#xidmetler`): 4 service cards. Client component
 * because each service card's "Sifariş et" button links out to
 * WhatsApp, sourced from the shared `useSettingsQuery()` result.
 *
 * NOTE: a separate, concurrent work-stream is replacing these 4 "Sifariş
 * et" buttons' click behavior to open a new Order Flow wizard instead of
 * a direct WhatsApp link. This component only restyles the button —
 * the existing ExternalLink/href is left in place deliberately so the
 * other work-stream's onClick wiring has a stable spot to land on.
 */
export function XidmetlerSection() {
  const t = useTranslations("home.xidmetler");
  const { data: settings } = useSettingsQuery();

  const whatsappUrl = settings
    ? buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_default_text)
    : undefined;

  const services = SERVICE_KEYS.map((key) => ({
    key,
    title: t(`${key}.title`),
    desc: t(`${key}.desc`),
    Icon: SERVICE_ICONS[key],
  }));

  return (
    <section id="xidmetler" className="bg-surface py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const isFirst = index === 0;
            return (
              <div
                key={service.key}
                className={cn(
                  "flex flex-col rounded-xl p-6",
                  isFirst ? "bg-brand-green text-brand-dark" : "bg-white",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full",
                    isFirst ? "bg-white text-brand-dark" : "bg-brand-green text-brand-dark",
                  )}
                >
                  <service.Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading font-semibold">{service.title}</h3>
                <p
                  className={cn(
                    "mt-2 flex-1 text-sm",
                    isFirst ? "text-brand-dark/70" : "text-muted",
                  )}
                >
                  {service.desc}
                </p>
                {whatsappUrl ? (
                  // TODO(order-flow): wire onClick to open the Order Flow modal.
                  // Keep this ExternalLink's href/behavior untouched until that
                  // work-stream replaces it — this component only owns styling.
                  <ExternalLink
                    href={whatsappUrl}
                    analyticsLabel={`xidmetler_order_${service.key}`}
                    className={cn(
                      buttonVariants({ variant: "dark-solid", size: "sm" }),
                      "mt-4 self-start",
                    )}
                  >
                    {t("orderCta")}
                  </ExternalLink>
                ) : null}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
