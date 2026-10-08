"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChipSingleSelect } from "@/components/wizard/fields/ChipGroup";
import { StepFooter } from "@/components/wizard/StepFooter";
import { useFocusFirstInvalidField } from "@/lib/validation/useFocusFirstInvalidField";
import {
  medicDetailsSchema,
  SPECIALTY_VALUES,
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
  const tCommon = useTranslations("wizard.common");

  const form = useForm<MedicDetailsData>({
    resolver: zodResolver(medicDetailsSchema),
    mode: "onSubmit",
    defaultValues: {
      specialty: defaultValues.specialty,
      first_aid_cert: defaultValues.first_aid_cert,
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
  const yesNoOptions = [
    { value: "true", label: tCommon("yes") },
    { value: "false", label: tCommon("no") },
  ];

  return (
    <form noValidate onSubmit={form.handleSubmit(onValid)} className="space-y-6">
      <div ref={liveRegionRef} aria-live="assertive" role="alert" className="sr-only" />

      <Controller
        control={form.control}
        name="specialty"
        render={({ field }) => (
          <ChipSingleSelect
            name="specialty"
            label={t("specialtyLabel")}
            value={field.value}
            onChange={field.onChange}
            options={specialtyOptions}
            error={errorMessage("specialty")}
            registerRef={registerField("specialty")}
          />
        )}
      />

      <Controller
        control={form.control}
        name="first_aid_cert"
        render={({ field }) => (
          <ChipSingleSelect
            name="first_aid_cert"
            label={t("firstAidCertLabel")}
            value={field.value === undefined ? undefined : String(field.value)}
            onChange={(value) => field.onChange(value === "true")}
            options={yesNoOptions}
            error={errorMessage("first_aid_cert")}
            registerRef={registerField("first_aid_cert")}
          />
        )}
      />

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
