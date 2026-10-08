"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChipMultiSelect } from "@/components/wizard/fields/ChipGroup";
import { ORDER_ROLE_VALUES, type OrderRole } from "@/lib/order/orderFlowTypes";

interface OrderStepRolesProps {
  value: OrderRole[];
  onChange: (value: OrderRole[]) => void;
  onNext: () => void;
}

/** Step 1: which roles are needed — any combination allowed, no artificial exclusivity (e.g. "whole rival team" + "referee" together is fine). */
export function OrderStepRoles({ value, onChange, onNext }: OrderStepRolesProps) {
  const tRoles = useTranslations("order.roles");
  const tNav = useTranslations("order.nav");

  const options = ORDER_ROLE_VALUES.map((role) => ({ value: role, label: tRoles(role) }));

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground">{tRoles("title")}</h2>
      <p className="mb-5 text-sm text-muted">{tRoles("description")}</p>

      <ChipMultiSelect values={value} onChange={(next) => onChange(next as OrderRole[])} options={options} />

      <div className="mt-6 flex justify-end">
        <Button type="button" size="lg" disabled={value.length === 0} onClick={onNext}>
          {tNav("continue")}
        </Button>
      </div>
    </div>
  );
}
