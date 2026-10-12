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
 * WhatsApp, sourced from the shared `useSettingsQuery()` result. The
 * whole card is clickable (not just the button) and opens WhatsApp with
 * a message specific to that service — never the generic default text.
 */
export function XidmetlerSection() {
  const t = useTranslations("home.xidmetler");
  const { data: settings } = useSettingsQuery();

  const services = SERVICE_KEYS.map((key) => ({
    key,
    title: t(`${key}.title`),
    desc: t(`${key}.desc`),
    message: t(`${key}.whatsappMessage`),
    Icon: SERVICE_ICONS[key],
  }));

  return (
    <section id="xidmetler" className="bg-surface py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const whatsappUrl = settings ? buildWhatsAppUrl(settings.whatsapp_number, service.message) : undefined;
            if (!whatsappUrl) {
              return (
                <div key={service.key} className="flex flex-col rounded-xl bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green/15 text-brand-dark">
                    <service.Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-heading font-semibold">{service.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted">{service.desc}</p>
                </div>
              );
            }
            return (
              <ExternalLink
                key={service.key}
                href={whatsappUrl}
                analyticsLabel={`xidmetler_order_${service.key}`}
                className="group flex cursor-pointer flex-col rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:bg-brand-green hover:text-brand-dark hover:shadow-lg"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green/15 text-brand-dark transition-colors duration-200 group-hover:bg-white">
                  <service.Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading font-semibold">{service.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted transition-colors duration-200 group-hover:text-brand-dark/70">
                  {service.desc}
                </p>
                <span
                  className={cn(
                    buttonVariants({ variant: "dark-solid", size: "sm" }),
                    "pointer-events-none mt-4 self-start",
                  )}
                >
                  {t("orderCta")}
                </span>
              </ExternalLink>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
