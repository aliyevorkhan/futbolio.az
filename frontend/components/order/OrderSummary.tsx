"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "@/components/shared/ExternalLink";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { buildWhatsAppUrl } from "@/lib/utils";
import { buildWhatsAppMessage, type OrderMessageLabels } from "@/lib/order/buildWhatsAppMessage";
import {
  ORDER_ROLE_VALUES,
  ORDER_LEVEL_VALUES,
  ORDER_DURATION_VALUES,
  ORDER_PRICE_RANGE_VALUES,
  type OrderAnswers,
} from "@/lib/order/orderFlowTypes";

interface OrderSummaryProps {
  answers: OrderAnswers;
  onBack: () => void;
}

function buildLookup<T extends string>(values: readonly T[], translate: (value: T) => string): Record<T, string> {
  return Object.fromEntries(values.map((value) => [value, translate(value)])) as Record<T, string>;
}

/** Final recap screen (after Step 6) + the "WhatsApp-da göndər" hand-off link. Not one of the 6 numbered/stepper-tracked steps. */
export function OrderSummary({ answers, onBack }: OrderSummaryProps) {
  const t = useTranslations("order");
  const tRoles = useTranslations("order.roles");
  const tLevels = useTranslations("order.levels");
  const tDurations = useTranslations("order.durations");
  const tPrices = useTranslations("order.priceRanges");
  const { data: settings } = useSettingsQuery();

  const tTemplate = useTranslations("order.whatsapp");

  const labels: OrderMessageLabels = {
    role: buildLookup(ORDER_ROLE_VALUES, (value) => tRoles(value)),
    level: buildLookup(ORDER_LEVEL_VALUES, (value) => tLevels(value)),
    duration: buildLookup(ORDER_DURATION_VALUES, (value) => tDurations(value)),
    priceRange: buildLookup(ORDER_PRICE_RANGE_VALUES, (value) => tPrices(value)),
    template: {
      greeting: tTemplate("greeting"),
      needLabel: tTemplate("needLabel"),
      levelLabel: tTemplate("levelLabel"),
      dateTimeLabel: tTemplate("dateTimeLabel"),
      stadiumLabel: tTemplate("stadiumLabel"),
      priceLabel: tTemplate("priceLabel"),
      nameLabel: tTemplate("nameLabel"),
      noteLabel: tTemplate("noteLabel"),
    },
  };

  const message = buildWhatsAppMessage(answers, labels);
  const whatsappUrl = settings ? buildWhatsAppUrl(settings.whatsapp_number, message) : undefined;

  const rolesText = answers.roles
    .map((role) =>
      role === "full_rival_team"
        ? answers.teamSize
          ? `${labels.role.full_rival_team} (${answers.teamSize})`
          : labels.role.full_rival_team
        : `${answers.counts[role] ?? 1} ${labels.role[role]}`,
    )
    .join(", ");

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground">{t("summary.title")}</h2>
      <p className="mb-5 text-sm text-muted">{t("summary.description")}</p>

      <dl className="space-y-3 rounded-lg border border-brand-dark/10 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("summary.rolesLabel")}</dt>
          <dd className="text-right font-medium text-foreground">{rolesText}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("summary.levelLabel")}</dt>
          <dd className="text-right font-medium text-foreground">{answers.level ? labels.level[answers.level] : ""}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("summary.dateTimeLabel")}</dt>
          <dd className="text-right font-medium text-foreground">
            {answers.date}, {answers.time}
            {answers.duration ? `, ${labels.duration[answers.duration]}` : ""}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("summary.stadiumLabel")}</dt>
          <dd className="text-right font-medium text-foreground">{answers.stadium}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("summary.priceLabel")}</dt>
          <dd className="text-right font-medium text-foreground">
            {answers.priceRange ? labels.priceRange[answers.priceRange] : ""}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("summary.nameLabel")}</dt>
          <dd className="text-right font-medium text-foreground">{answers.name}</dd>
        </div>
        {answers.note.trim() ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("summary.noteLabel")}</dt>
            <dd className="text-right font-medium text-foreground">{answers.note}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          {t("nav.back")}
        </Button>
        {whatsappUrl ? (
          <Button asChild variant="dark-solid" size="lg">
            <ExternalLink href={whatsappUrl} analyticsLabel="order_flow_whatsapp_send">
              {t("summary.sendButton")}
            </ExternalLink>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
