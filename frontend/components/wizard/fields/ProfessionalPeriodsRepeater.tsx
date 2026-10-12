"use client";

import { useEffect } from "react";
import { useFieldArray, useFormState, type Control } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PROFESSIONAL_PERIOD_YEARS,
  type PlayerDetails as PlayerDetailsData,
} from "@/lib/validation/wizard/step2.schema";

const selectClassName =
  "flex h-11 w-full rounded-lg border border-brand-dark/15 bg-white px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2";

/**
 * Step 2 (player)'s "played professionally" repeater — one row per
 * claimed period, each with a from-year/to-year select and an optional
 * club text input. Backed by RHF's `useFieldArray` (one shared source
 * of truth with the rest of `PlayerDetails`' form, no separate local
 * state to keep in sync).
 */
export function ProfessionalPeriodsRepeater({
  control,
  error,
  registerRef,
}: {
  control: Control<PlayerDetailsData>;
  error?: string;
  registerRef?: (el: HTMLElement | null) => void;
}) {
  const tErrors = useTranslations("wizard.errors");
  const t = useTranslations("wizard.step2.player.professionalPeriods");
  const { fields, append, remove } = useFieldArray({ control, name: "professional_periods" });
  const { errors } = useFormState({ control, name: "professional_periods" });

  // Show the first period's fields immediately — the user shouldn't have
  // to press "add" just to see the one period they're about to describe.
  useEffect(() => {
    if (fields.length === 0) {
      const currentYear = new Date().getFullYear();
      append({ start_year: currentYear, end_year: currentYear, club: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length]);

  return (
    <div ref={registerRef as React.Ref<HTMLDivElement>} tabIndex={-1}>
      <p className="mb-2 text-sm font-medium text-foreground">{t("label")}</p>
      <div className="space-y-3">
        {fields.map((field, index) => {
          const rowError = errors.professional_periods?.[index]?.end_year?.message;
          return (
            <div key={field.id} className="rounded-lg border border-brand-dark/10 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted">{t("periodLabel", { n: index + 1 })}</p>
                {index > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0"
                    onClick={() => remove(index)}
                    aria-label={t("remove")}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[7rem] flex-1">
                  <label className="mb-1 block text-xs text-muted" htmlFor={`professional_periods.${index}.start_year`}>
                    {t("fromLabel")}
                  </label>
                  <select
                    id={`professional_periods.${index}.start_year`}
                    className={selectClassName}
                    {...control.register(`professional_periods.${index}.start_year`, { valueAsNumber: true })}
                  >
                    {PROFESSIONAL_PERIOD_YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[7rem] flex-1">
                  <label className="mb-1 block text-xs text-muted" htmlFor={`professional_periods.${index}.end_year`}>
                    {t("toLabel")}
                  </label>
                  <select
                    id={`professional_periods.${index}.end_year`}
                    className={selectClassName}
                    {...control.register(`professional_periods.${index}.end_year`, { valueAsNumber: true })}
                  >
                    {PROFESSIONAL_PERIOD_YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[10rem] flex-[2]">
                  <label className="mb-1 block text-xs text-muted" htmlFor={`professional_periods.${index}.club`}>
                    {t("clubLabel")}
                  </label>
                  <Input
                    id={`professional_periods.${index}.club`}
                    placeholder={t("clubPlaceholder")}
                    {...control.register(`professional_periods.${index}.club`)}
                  />
                </div>
              </div>
              {rowError ? <p className="mt-2 text-sm text-red-600">{tErrors(String(rowError))}</p> : null}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => {
          const currentYear = new Date().getFullYear();
          append({ start_year: currentYear, end_year: currentYear, club: "" });
        }}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("addAnother")}
      </Button>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
