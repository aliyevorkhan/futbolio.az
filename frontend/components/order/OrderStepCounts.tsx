"use client";

import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipSingleSelect } from "@/components/wizard/fields/ChipGroup";
import {
  TEAM_SIZE_VALUES,
  type OrderAnswers,
  type CountableOrderRole,
  type TeamSize,
} from "@/lib/order/orderFlowTypes";

interface OrderStepCountsProps {
  answers: OrderAnswers;
  onChange: (patch: Partial<OrderAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MIN_COUNT = 1;
const MAX_COUNT = 20;

/** Step 2: a numeric stepper per selected role (except "full_rival_team", which gets team-size chips instead). */
export function OrderStepCounts({ answers, onChange, onNext, onBack }: OrderStepCountsProps) {
  const t = useTranslations("order");
  const tRoles = useTranslations("order.roles");
  const tNav = useTranslations("order.nav");

  const countableRoles = answers.roles.filter(
    (role): role is CountableOrderRole => role !== "full_rival_team",
  );
  const hasFullRivalTeam = answers.roles.includes("full_rival_team");

  const setCount = (role: CountableOrderRole, count: number) => {
    const clamped = Math.max(MIN_COUNT, Math.min(MAX_COUNT, count));
    onChange({ counts: { ...answers.counts, [role]: clamped } });
  };

  const teamSizeOptions = TEAM_SIZE_VALUES.map((size) => ({ value: size, label: size }));

  const isValid = (!hasFullRivalTeam || Boolean(answers.teamSize)) && countableRoles.length + (hasFullRivalTeam ? 1 : 0) > 0;

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground">{t("counts.title")}</h2>
      <p className="mb-5 text-sm text-muted">{t("counts.description")}</p>

      <div className="space-y-4">
        {countableRoles.map((role) => {
          const count = answers.counts[role] ?? MIN_COUNT;
          return (
            <div key={role} className="flex items-center justify-between rounded-lg border border-brand-dark/10 px-4 py-3">
              <span className="text-sm font-medium text-foreground">{t("counts.countLabel", { role: tRoles(role) })}</span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setCount(role, count - 1)}
                  disabled={count <= MIN_COUNT}
                  aria-label={t("counts.decrease")}
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </Button>
                <span className="w-6 text-center text-base font-semibold text-foreground" aria-live="polite">
                  {count}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setCount(role, count + 1)}
                  disabled={count >= MAX_COUNT}
                  aria-label={t("counts.increase")}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          );
        })}

        {hasFullRivalTeam ? (
          <ChipSingleSelect
            name="teamSize"
            label={t("counts.teamSizeLabel")}
            value={answers.teamSize}
            onChange={(value) => onChange({ teamSize: value as TeamSize })}
            options={teamSizeOptions}
          />
        ) : null}
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
