"use client";

import { useTranslations } from "next-intl";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { buildWhatsAppUrl } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ExternalLink } from "@/components/shared/ExternalLink";

/**
 * "Xidmətlər" section (`#xidmetler`): 4 service cards + a "how many do
 * you need" informational block. Client component because each
 * service card's "Sifariş et" button links out to WhatsApp, sourced
 * from the shared `useSettingsQuery()` result.
 */
export function XidmetlerSection() {
  const t = useTranslations("home.xidmetler");
  const { data: settings } = useSettingsQuery();

  const whatsappUrl = settings
    ? buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_default_text)
    : undefined;

  const services = [
    { key: "futbolcu", title: t("futbolcu.title"), desc: t("futbolcu.desc") },
    { key: "qapici", title: t("qapici.title"), desc: t("qapici.desc") },
    { key: "hakim", title: t("hakim.title"), desc: t("hakim.desc") },
    { key: "hekim", title: t("hekim.title"), desc: t("hekim.desc") },
  ];

  const howMany = [
    { title: t("howMany.oneTitle"), desc: t("howMany.oneDesc") },
    { title: t("howMany.manyTitle"), desc: t("howMany.manyDesc") },
    { title: t("howMany.rivalTitle"), desc: t("howMany.rivalDesc") },
  ];

  return (
    <section id="xidmetler" className="bg-surface py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.key}
              className="flex flex-col rounded-xl border border-brand-dark/10 bg-white p-6"
            >
              <h3 className="font-semibold">{service.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{service.desc}</p>
              {whatsappUrl ? (
                <ExternalLink
                  href={whatsappUrl}
                  analyticsLabel={`xidmetler_order_${service.key}`}
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-brand-green px-4 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-green/90"
                >
                  {t("orderCta")}
                </ExternalLink>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-lg font-semibold">{t("howMany.title")}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {howMany.map((item) => (
              <div
                key={item.title}
                className="rounded-xl bg-white p-5 text-sm"
              >
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
