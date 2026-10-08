"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChipSingleSelect } from "@/components/wizard/fields/ChipGroup";
import { ORDER_LEVEL_VALUES, type OrderLevel } from "@/lib/order/orderFlowTypes";

interface OrderStepLevelProps {
  value: OrderLevel | undefined;
  onChange: (value: OrderLevel) => void;
  onNext: () => void;
  onBack: () => void;
}

/** Step 3: desired skill level — single-select. */
export function OrderStepLevel({ value, onChange, onNext, onBack }: OrderStepLevelProps) {
  const tLevels = useTranslations("order.levels");
  const tNav = useTranslations("order.nav");

  const options = ORDER_LEVEL_VALUES.map((level) => ({ value: level, label: tLevels(level) }));

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground">{tLevels("title")}</h2>
      <p className="mb-5 text-sm text-muted">{tLevels("description")}</p>

      <ChipSingleSelect name="level" value={value} onChange={(next) => onChange(next as OrderLevel)} options={options} />

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          {tNav("back")}
        </Button>
        <Button type="button" size="lg" disabled={!value} onClick={onNext}>
          {tNav("continue")}
        </Button>
      </div>
    </div>
  );
}
