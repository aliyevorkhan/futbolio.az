"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChipSingleSelect } from "@/components/wizard/fields/ChipGroup";
import { ORDER_PRICE_RANGE_VALUES, type OrderPriceRange } from "@/lib/order/orderFlowTypes";

interface OrderStepPriceRangeProps {
  value: OrderPriceRange | undefined;
  onChange: (value: OrderPriceRange) => void;
  onNext: () => void;
  onBack: () => void;
}

/** Step 5: expected price range — single-select. */
export function OrderStepPriceRange({ value, onChange, onNext, onBack }: OrderStepPriceRangeProps) {
  const tPrices = useTranslations("order.priceRanges");
  const tNav = useTranslations("order.nav");

  const options = ORDER_PRICE_RANGE_VALUES.map((range) => ({ value: range, label: tPrices(range) }));

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground">{tPrices("title")}</h2>
      <p className="mb-5 text-sm text-muted">{tPrices("description")}</p>

      <ChipSingleSelect
        name="priceRange"
        value={value}
        onChange={(next) => onChange(next as OrderPriceRange)}
        options={options}
      />

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
