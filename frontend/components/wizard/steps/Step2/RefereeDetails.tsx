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
  refereeDetailsSchema,
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
  const tCommon = useTranslations("wizard.common");

  const form = useForm<RefereeDetailsData>({
    resolver: zodResolver(refereeDetailsSchema),
    mode: "onSubmit",
    defaultValues: {
      has_official_certification: defaultValues.has_official_certification,
      certification_name: defaultValues.certification_name ?? "",
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

  const yearsOptions = EXPERIENCE_YEARS_VALUES.map((value) => ({ value, label: t(`years.${value}`) }));
  const gameTypeOptions = GAME_TYPE_VALUES.map((value) => ({ value, label: t(`gameTypes.${value}`) }));
  const yesNoOptions = [
    { value: "true", label: tCommon("yes") },
    { value: "false", label: tCommon("no") },
  ];

  const hasOfficialCertification = form.watch("has_official_certification");

  return (
    <form noValidate onSubmit={form.handleSubmit(onValid)} className="space-y-6">
      <div ref={liveRegionRef} aria-live="assertive" role="alert" className="sr-only" />

      <Controller
        control={form.control}
        name="has_official_certification"
        render={({ field }) => (
          <ChipSingleSelect
            name="has_official_certification"
            label={t("hasOfficialCertificationLabel")}
            value={field.value === undefined ? undefined : String(field.value)}
            onChange={(value) => field.onChange(value === "true")}
            options={yesNoOptions}
            error={errorMessage("has_official_certification")}
            registerRef={registerField("has_official_certification")}
          />
        )}
      />

      {hasOfficialCertification ? (
        <div>
          <Label htmlFor="certification_name">{t("certificationNameLabel")}</Label>
          <Input
            id="certification_name"
            placeholder={t("certificationNamePlaceholder")}
            aria-invalid={Boolean(form.formState.errors.certification_name)}
            {...form.register("certification_name")}
            ref={(el) => {
              form.register("certification_name").ref(el);
              registerField("certification_name")(el);
            }}
          />
          {errorMessage("certification_name") ? (
            <p className="mt-1.5 text-sm text-red-600">{errorMessage("certification_name")}</p>
          ) : null}
        </div>
      ) : null}

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
