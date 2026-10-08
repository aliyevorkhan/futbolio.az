"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ChipMultiSelect } from "@/components/wizard/fields/ChipGroup";
import { AvailabilityGrid } from "@/components/wizard/fields/AvailabilityGrid";
import { StepHeader } from "@/components/wizard/StepHeader";
import { StepFooter } from "@/components/wizard/StepFooter";
import { useFocusFirstInvalidField } from "@/lib/validation/useFocusFirstInvalidField";
import { DISTRICT_CODES } from "@/lib/validation/shared/districts";
import {
  step3Schema,
  DAY_VALUES,
  HOUR_SLOT_VALUES,
  STEP3_FIELD_ORDER,
  type Step3Data,
  type DayValue,
  type HourSlotValue,
} from "@/lib/validation/wizard/step3.schema";

interface Step3Props {
  defaultValues: Partial<Step3Data>;
  onValid: (data: Step3Data) => void;
  onChange: (values: Partial<Step3Data>) => void;
  onBack: () => void;
}

export function Step3Availability({ defaultValues, onValid, onChange, onBack }: Step3Props) {
  const t = useTranslations("wizard.step3");
  const tErrors = useTranslations("wizard.errors");
  const tDays = useTranslations("wizard.days");
  const tSlots = useTranslations("wizard.hourSlots");
  const tDistricts = useTranslations("wizard.districts");

  const form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    mode: "onSubmit",
    defaultValues: {
      time_slots: defaultValues.time_slots ?? [],
      districts: defaultValues.districts ?? [],
    } as Step3Data,
  });

  useEffect(() => {
    const subscription = form.watch((values) => onChange(values as Partial<Step3Data>));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const { registerField, liveRegionRef } = useFocusFirstInvalidField(
    form.formState.errors as Record<string, { message?: unknown } | undefined>,
    STEP3_FIELD_ORDER,
  );

  const errorMessage = (field: keyof Step3Data) => {
    const message = form.formState.errors[field]?.message;
    return message ? tErrors(message as string) : undefined;
  };

  const dayLabels = Object.fromEntries(DAY_VALUES.map((value) => [value, tDays(value)])) as Record<
    DayValue,
    string
  >;
  const slotLabels = Object.fromEntries(HOUR_SLOT_VALUES.map((value) => [value, tSlots(value)])) as Record<
    HourSlotValue,
    string
  >;
  const districtOptions = DISTRICT_CODES.map((value) => ({ value, label: tDistricts(value) }));

  return (
    <div>
      <StepHeader title={t("title")} onBack={onBack} />
      <p className="mb-6 text-muted">{t("description")}</p>

      <form noValidate onSubmit={form.handleSubmit(onValid)} className="space-y-6">
        <div ref={liveRegionRef} aria-live="assertive" role="alert" className="sr-only" />

        <Controller
          control={form.control}
          name="time_slots"
          render={({ field }) => (
            <AvailabilityGrid
              label={t("timeSlotsLabel")}
              values={field.value}
              onChange={field.onChange}
              dayLabels={dayLabels}
              slotLabels={slotLabels}
              error={errorMessage("time_slots")}
              registerRef={registerField("time_slots")}
            />
          )}
        />

        <Controller
          control={form.control}
          name="districts"
          render={({ field }) => (
            <ChipMultiSelect
              label={t("districtsLabel")}
              values={field.value}
              onChange={field.onChange}
              options={districtOptions}
              error={errorMessage("districts")}
              registerRef={registerField("districts")}
            />
          )}
        />

        <StepFooter onBack={onBack} />
      </form>
    </div>
  );
}
