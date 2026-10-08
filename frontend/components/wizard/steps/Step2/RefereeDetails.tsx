"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { ChipSingleSelect, ChipMultiSelect } from "@/components/wizard/fields/ChipGroup";
import { StepFooter } from "@/components/wizard/StepFooter";
import { useFocusFirstInvalidField } from "@/lib/validation/useFocusFirstInvalidField";
import {
  refereeDetailsSchema,
  LICENSE_STATUS_VALUES,
  EXPERIENCE_YEARS_VALUES,
  GAME_TYPE_VALUES,
  REFEREE_STEP2_FIELD_ORDER,
  type RefereeDetails as RefereeDetailsData,
} from "@/lib/validation/wizard/step2.schema";

interface RefereeDetailsProps {
  defaultValues: Partial<RefereeDetailsData>;
  onValid: (data: RefereeDetailsData) => void;
  onChange: (values: Partial<RefereeDetailsData>) => void;
  onBack: () => void;
}

export function RefereeDetails({ defaultValues, onValid, onChange, onBack }: RefereeDetailsProps) {
  const t = useTranslations("wizard.step2.referee");
  const tErrors = useTranslations("wizard.errors");

  const form = useForm<RefereeDetailsData>({
    resolver: zodResolver(refereeDetailsSchema),
    mode: "onSubmit",
    defaultValues: {
      license_status: defaultValues.license_status,
      years_refereeing: defaultValues.years_refereeing,
      game_types: defaultValues.game_types ?? [],
      experience_text: defaultValues.experience_text ?? "",
    } as RefereeDetailsData,
  });

  useEffect(() => {
    const subscription = form.watch((values) => onChange(values as Partial<RefereeDetailsData>));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const { registerField, liveRegionRef } = useFocusFirstInvalidField(
    form.formState.errors as Record<string, { message?: unknown } | undefined>,
    REFEREE_STEP2_FIELD_ORDER,
  );

  const errorMessage = (field: keyof RefereeDetailsData) => {
    const message = form.formState.errors[field]?.message;
    return message ? tErrors(message as string) : undefined;
  };

  const licenseOptions = LICENSE_STATUS_VALUES.map((value) => ({ value, label: t(`license.${value}`) }));
  const yearsOptions = EXPERIENCE_YEARS_VALUES.map((value) => ({ value, label: t(`years.${value}`) }));
  const gameTypeOptions = GAME_TYPE_VALUES.map((value) => ({ value, label: t(`gameTypes.${value}`) }));

  return (
    <form noValidate onSubmit={form.handleSubmit(onValid)} className="space-y-6">
      <div ref={liveRegionRef} aria-live="assertive" role="alert" className="sr-only" />

      <Controller
        control={form.control}
        name="license_status"
        render={({ field }) => (
          <ChipSingleSelect
            name="license_status"
            label={t("licenseStatusLabel")}
            value={field.value}
            onChange={field.onChange}
            options={licenseOptions}
            error={errorMessage("license_status")}
            registerRef={registerField("license_status")}
          />
        )}
      />

      <Controller
        control={form.control}
        name="years_refereeing"
        render={({ field }) => (
          <ChipSingleSelect
            name="years_refereeing"
            label={t("yearsRefereeingLabel")}
            value={field.value}
            onChange={field.onChange}
            options={yearsOptions}
            error={errorMessage("years_refereeing")}
            registerRef={registerField("years_refereeing")}
          />
        )}
      />

      <Controller
        control={form.control}
        name="game_types"
        render={({ field }) => (
          <ChipMultiSelect
            label={t("gameTypesLabel")}
            values={field.value ?? []}
            onChange={field.onChange}
            options={gameTypeOptions}
            error={errorMessage("game_types")}
            registerRef={registerField("game_types")}
          />
        )}
      />

      <div>
        <Label htmlFor="experience_text">{t("experienceLabel")}</Label>
        <textarea
          id="experience_text"
          placeholder={t("experiencePlaceholder")}
          rows={3}
          className="flex w-full rounded-lg border border-brand-dark/15 bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-muted-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
          {...form.register("experience_text")}
        />
        {errorMessage("experience_text") ? (
          <p className="mt-1.5 text-sm text-red-600">{errorMessage("experience_text")}</p>
        ) : null}
      </div>

      <StepFooter onBack={onBack} />
    </form>
  );
}
