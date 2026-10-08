"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChipSingleSelect } from "@/components/wizard/fields/ChipGroup";
import { ORDER_DURATION_VALUES, type OrderAnswers, type OrderDuration } from "@/lib/order/orderFlowTypes";

interface OrderStepGameDetailsProps {
  answers: OrderAnswers;
  onChange: (patch: Partial<OrderAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

function isLikelyValidUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Step 4: date, time, duration, stadium, optional map link. This modal only ever mounts post-interaction (never server-rendered), so no SSR/hydration caution is needed for the date `min`. */
export function OrderStepGameDetails({ answers, onChange, onNext, onBack }: OrderStepGameDetailsProps) {
  const t = useTranslations("order");
  const tDurations = useTranslations("order.durations");
  const tNav = useTranslations("order.nav");

  const [mapLinkTouched, setMapLinkTouched] = useState(false);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const durationOptions = ORDER_DURATION_VALUES.map((duration) => ({ value: duration, label: tDurations(duration) }));
  const mapLinkInvalid = mapLinkTouched && !isLikelyValidUrl(answers.mapLink);

  const isValid = Boolean(answers.date && answers.time && answers.duration && answers.stadium.trim());

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground">{t("gameDetails.title")}</h2>
      <p className="mb-5 text-sm text-muted">{t("gameDetails.description")}</p>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="order_date">{t("gameDetails.dateLabel")}</Label>
            <Input
              id="order_date"
              type="date"
              min={today}
              value={answers.date}
              onChange={(event) => onChange({ date: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="order_time">{t("gameDetails.timeLabel")}</Label>
            <Input
              id="order_time"
              type="time"
              value={answers.time}
              onChange={(event) => onChange({ time: event.target.value })}
            />
          </div>
        </div>

        <ChipSingleSelect
          name="duration"
          label={t("gameDetails.durationLabel")}
          value={answers.duration}
          onChange={(value) => onChange({ duration: value as OrderDuration })}
          options={durationOptions}
        />

        <div>
          <Label htmlFor="order_stadium">{t("gameDetails.stadiumLabel")}</Label>
          <Input
            id="order_stadium"
            placeholder={t("gameDetails.stadiumPlaceholder")}
            value={answers.stadium}
            onChange={(event) => onChange({ stadium: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="order_map_link">{t("gameDetails.mapLinkLabel")}</Label>
          <Input
            id="order_map_link"
            placeholder={t("gameDetails.mapLinkPlaceholder")}
            value={answers.mapLink}
            aria-invalid={mapLinkInvalid}
            onChange={(event) => onChange({ mapLink: event.target.value })}
            onBlur={() => setMapLinkTouched(true)}
          />
          {mapLinkInvalid ? (
            <p className="mt-1.5 text-sm text-red-600">{t("gameDetails.mapLinkInvalid")}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          {tNav("back")}
        </Button>
        <Button type="button" size="lg" disabled={!isValid} onClick={onNext}>
          {tNav("continue")}
        </Button>
      </div>
    </div>
  );
}
