"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChipSingleSelect, ChipMultiSelect } from "@/components/wizard/fields/ChipGroup";
import { StepFooter } from "@/components/wizard/StepFooter";
import { useFocusFirstInvalidField } from "@/lib/validation/useFocusFirstInvalidField";
import {
  medicDetailsSchema,
  SPECIALTY_VALUES,
  EQUIPMENT_STATUS_VALUES,
  EXPERIENCE_YEARS_VALUES,
  MEDIC_STEP2_FIELD_ORDER,
  type MedicDetails as MedicDetailsData,
} from "@/lib/validation/wizard/step2.schema";

interface MedicDetailsProps {
  defaultValues: Partial<MedicDetailsData>;
  onValid: (data: MedicDetailsData) => void;
  onChange: (values: Partial<MedicDetailsData>) => void;
  onBack: () => void;
}

export function MedicDetails({ defaultValues, onValid, onChange, onBack }: MedicDetailsProps) {
  const t = useTranslations("wizard.step2.medic");
  const tErrors = useTranslations("wizard.errors");

  const form = useForm<MedicDetailsData>({
    resolver: zodResolver(medicDetailsSchema),
    mode: "onSubmit",
    defaultValues: {
      specialty: defaultValues.specialty ?? [],
      equipment_status: defaultValues.equipment_status,
      equipment_missing_text: defaultValues.equipment_missing_text ?? "",
      work_experience: defaultValues.work_experience,
      workplace: defaultValues.workplace ?? "",
    } as MedicDetailsData,
  });

  useEffect(() => {
    const subscription = form.watch((values) => onChange(values as Partial<MedicDetailsData>));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const { registerField, liveRegionRef } = useFocusFirstInvalidField(
    form.formState.errors as Record<string, { message?: unknown } | undefined>,
    MEDIC_STEP2_FIELD_ORDER,
  );

  const errorMessage = (field: keyof MedicDetailsData) => {
    const message = form.formState.errors[field]?.message;
    return message ? tErrors(message as string) : undefined;
  };

  const specialtyOptions = SPECIALTY_VALUES.map((value) => ({ value, label: t(`specialty.${value}`) }));
  const yearsOptions = EXPERIENCE_YEARS_VALUES.map((value) => ({ value, label: t(`years.${value}`) }));
  const equipmentStatusOptions = EQUIPMENT_STATUS_VALUES.map((value) => ({
    value,
    label: t(`equipmentStatus.${value}`),
  }));

  const equipmentStatus = form.watch("equipment_status");

  return (
    <form noValidate onSubmit={form.handleSubmit(onValid)} className="space-y-6">
      <div ref={liveRegionRef} aria-live="assertive" role="alert" className="sr-only" />

      <Controller
        control={form.control}
        name="specialty"
        render={({ field }) => (
          <ChipMultiSelect
            label={t("specialtyLabel")}
            values={field.value ?? []}
            onChange={field.onChange}
            options={specialtyOptions}
            error={errorMessage("specialty")}
            registerRef={registerField("specialty")}
          />
        )}
      />

      <Controller
        control={form.control}
        name="equipment_status"
        render={({ field }) => (
          <ChipSingleSelect
            name="equipment_status"
            label={t("equipmentStatusLabel")}
            value={field.value}
            onChange={field.onChange}
            options={equipmentStatusOptions}
            error={errorMessage("equipment_status")}
            registerRef={registerField("equipment_status")}
          />
        )}
      />

      {equipmentStatus === "partial" ? (
        <div>
          <Label htmlFor="equipment_missing_text">{t("equipmentMissingLabel")}</Label>
          <textarea
            id="equipment_missing_text"
            placeholder={t("equipmentMissingPlaceholder")}
            rows={3}
            aria-invalid={Boolean(form.formState.errors.equipment_missing_text)}
            className="flex w-full rounded-lg border border-brand-dark/15 bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-muted-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 aria-[invalid=true]:border-red-500"
            {...form.register("equipment_missing_text")}
            ref={(el) => {
              form.register("equipment_missing_text").ref(el);
              registerField("equipment_missing_text")(el);
            }}
          />
          {errorMessage("equipment_missing_text") ? (
            <p className="mt-1.5 text-sm text-red-600">{errorMessage("equipment_missing_text")}</p>
          ) : null}
        </div>
      ) : null}

      <Controller
        control={form.control}
        name="work_experience"
        render={({ field }) => (
          <ChipSingleSelect
            name="work_experience"
            label={t("workExperienceLabel")}
            value={field.value}
            onChange={field.onChange}
            options={yearsOptions}
            error={errorMessage("work_experience")}
            registerRef={registerField("work_experience")}
          />
        )}
      />

      <div>
        <Label htmlFor="workplace">{t("workplaceLabel")}</Label>
        <Input id="workplace" placeholder={t("workplacePlaceholder")} {...form.register("workplace")} />
        {errorMessage("workplace") ? (
          <p className="mt-1.5 text-sm text-red-600">{errorMessage("workplace")}</p>
        ) : null}
      </div>

      <StepFooter onBack={onBack} />
    </form>
  );
}
