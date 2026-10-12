"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChipSingleSelect, ChipMultiSelect } from "@/components/wizard/fields/ChipGroup";
import { ProfessionalPeriodsRepeater } from "@/components/wizard/fields/ProfessionalPeriodsRepeater";
import { UniversitySelect } from "@/components/wizard/fields/UniversitySelect";
import { StepFooter } from "@/components/wizard/StepFooter";
import { useFocusFirstInvalidField } from "@/lib/validation/useFocusFirstInvalidField";
import {
  playerDetailsSchema,
  POSITION_VALUES,
  FOOT_VALUES,
  EXPERIENCE_YEARS_VALUES,
  PLAYER_EXPERIENCE_LEVEL_VALUES,
  PLAYER_STEP2_FIELD_ORDER,
  type PlayerDetails as PlayerDetailsData,
} from "@/lib/validation/wizard/step2.schema";

interface PlayerDetailsProps {
  defaultValues: Partial<PlayerDetailsData>;
  onValid: (data: PlayerDetailsData) => void;
  onChange: (values: Partial<PlayerDetailsData>) => void;
  onBack: () => void;
}

export function PlayerDetails({ defaultValues, onValid, onChange, onBack }: PlayerDetailsProps) {
  const t = useTranslations("wizard.step2.player");
  const tErrors = useTranslations("wizard.errors");
  const tCommon = useTranslations("wizard.common");

  const form = useForm<PlayerDetailsData>({
    resolver: zodResolver(playerDetailsSchema),
    mode: "onSubmit",
    defaultValues: {
      main_position: defaultValues.main_position,
      extra_positions: defaultValues.extra_positions ?? [],
      preferred_foot: defaultValues.preferred_foot,
      years_playing: defaultValues.years_playing,
      club_experience_text: defaultValues.club_experience_text ?? "",
      experience_level: defaultValues.experience_level,
      is_university_student: defaultValues.is_university_student,
      university_name: defaultValues.university_name ?? "",
      course_year: defaultValues.course_year ?? undefined,
      has_pro_experience: defaultValues.has_pro_experience,
      hourly_rate_azn: defaultValues.hourly_rate_azn,
      professional_periods: defaultValues.professional_periods ?? [],
    } as PlayerDetailsData,
  });

  useEffect(() => {
    const subscription = form.watch((values) => onChange(values as Partial<PlayerDetailsData>));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const { registerField, liveRegionRef } = useFocusFirstInvalidField(
    form.formState.errors as Record<string, { message?: unknown } | undefined>,
    PLAYER_STEP2_FIELD_ORDER,
  );

  const errorMessage = (field: keyof PlayerDetailsData) => {
    const message = form.formState.errors[field]?.message;
    return message ? tErrors(message as string) : undefined;
  };

  const positionOptions = POSITION_VALUES.map((value) => ({ value, label: t(`positions.${value}`) }));
  const footOptions = FOOT_VALUES.map((value) => ({ value, label: t(`foot.${value}`) }));
  const yearsOptions = EXPERIENCE_YEARS_VALUES.map((value) => ({ value, label: t(`years.${value}`) }));
  const experienceLevelOptions = PLAYER_EXPERIENCE_LEVEL_VALUES.map((value) => ({
    value,
    label: t(`experienceLevel.${value}`),
  }));
  const yesNoOptions = [
    { value: "true", label: tCommon("yes") },
    { value: "false", label: tCommon("no") },
  ];

  const mainPosition = form.watch("main_position");
  const hasPlayedProfessionally = form.watch("has_pro_experience");
  const isUniversityStudent = form.watch("is_university_student");
  const courseYearOptions = ["1", "2", "3", "4"].map((value) => ({ value, label: value }));

  return (
    <form noValidate onSubmit={form.handleSubmit(onValid)} className="space-y-6">
      <div ref={liveRegionRef} aria-live="assertive" role="alert" className="sr-only" />

      <Controller
        control={form.control}
        name="main_position"
        render={({ field }) => (
          <ChipSingleSelect
            name="main_position"
            label={t("mainPositionLabel")}
            value={field.value}
            onChange={field.onChange}
            options={positionOptions}
            error={errorMessage("main_position")}
            registerRef={registerField("main_position")}
          />
        )}
      />

      <Controller
        control={form.control}
        name="extra_positions"
        render={({ field }) => (
          <ChipMultiSelect
            label={t("extraPositionsLabel")}
            values={field.value ?? []}
            onChange={field.onChange}
            options={positionOptions}
            disabledValues={mainPosition ? [mainPosition] : []}
            disabledTitle={t("mainPositionDisabledTitle")}
            registerRef={registerField("extra_positions")}
          />
        )}
      />

      <Controller
        control={form.control}
        name="preferred_foot"
        render={({ field }) => (
          <ChipSingleSelect
            name="preferred_foot"
            label={t("preferredFootLabel")}
            value={field.value}
            onChange={field.onChange}
            options={footOptions}
            error={errorMessage("preferred_foot")}
            registerRef={registerField("preferred_foot")}
          />
        )}
      />

      <Controller
        control={form.control}
        name="years_playing"
        render={({ field }) => (
          <ChipSingleSelect
            name="years_playing"
            label={t("yearsPlayingLabel")}
            value={field.value}
            onChange={field.onChange}
            options={yearsOptions}
            error={errorMessage("years_playing")}
            registerRef={registerField("years_playing")}
          />
        )}
      />

      <Controller
        control={form.control}
        name="experience_level"
        render={({ field }) => (
          <ChipSingleSelect
            name="experience_level"
            label={t("experienceLevelLabel")}
            value={field.value}
            onChange={field.onChange}
            options={experienceLevelOptions}
            error={errorMessage("experience_level")}
            registerRef={registerField("experience_level")}
          />
        )}
      />

      <div>
        <Controller
          control={form.control}
          name="is_university_student"
          render={({ field }) => (
            <ChipSingleSelect
              name="is_university_student"
              label={t("isUniversityStudentLabel")}
              value={field.value === undefined ? undefined : String(field.value)}
              onChange={(value) => field.onChange(value === "true")}
              options={yesNoOptions}
              error={errorMessage("is_university_student")}
              registerRef={registerField("is_university_student")}
            />
          )}
        />
        <p className="mt-1.5 text-xs text-muted">{t("isUniversityStudentHint")}</p>
      </div>

      {isUniversityStudent ? (
        <div className="animate-role-fade-in grid gap-6 sm:grid-cols-2">
          <div>
            <Label>{t("universityNameLabel")}</Label>
            <Controller
              control={form.control}
              name="university_name"
              render={({ field }) => (
                <UniversitySelect
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={t("universityNamePlaceholder")}
                  searchPlaceholder={t("universityNameSearchPlaceholder")}
                  otherLabel={t("universityNameOther")}
                  otherInputPlaceholder={t("universityNameOtherPlaceholder")}
                  error={Boolean(form.formState.errors.university_name)}
                  registerRef={registerField("university_name")}
                />
              )}
            />
            {errorMessage("university_name") ? (
              <p className="mt-1.5 text-sm text-red-600">{errorMessage("university_name")}</p>
            ) : null}
          </div>

          <Controller
            control={form.control}
            name="course_year"
            render={({ field }) => (
              <ChipSingleSelect
                name="course_year"
                label={t("courseYearLabel")}
                value={field.value}
                onChange={field.onChange}
                options={courseYearOptions}
                error={errorMessage("course_year")}
                registerRef={registerField("course_year")}
              />
            )}
          />
        </div>
      ) : null}

      <Controller
        control={form.control}
        name="has_pro_experience"
        render={({ field }) => (
          <ChipSingleSelect
            name="has_pro_experience"
            label={t("hasPlayedProfessionallyLabel")}
            value={field.value === undefined ? undefined : String(field.value)}
            onChange={(value) => field.onChange(value === "true")}
            options={yesNoOptions}
            error={errorMessage("has_pro_experience")}
            registerRef={registerField("has_pro_experience")}
          />
        )}
      />

      {hasPlayedProfessionally ? (
        <ProfessionalPeriodsRepeater
          control={form.control}
          error={errorMessage("professional_periods")}
          registerRef={registerField("professional_periods")}
        />
      ) : null}

      <div>
        <Label htmlFor="hourly_rate_azn">{t("hourlyRateLabel")}</Label>
        <Input
          id="hourly_rate_azn"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder={t("hourlyRatePlaceholder")}
          aria-invalid={Boolean(form.formState.errors.hourly_rate_azn)}
          {...form.register("hourly_rate_azn")}
          ref={(el) => {
            form.register("hourly_rate_azn").ref(el);
            registerField("hourly_rate_azn")(el);
          }}
        />
        {/* TODO(owner-confirm): wording below is taken verbatim from the
            fix doc, which itself flags it as needing the owner's
            confirmation before launch — don't change it without that. */}
        <p className="mt-1.5 text-xs text-muted">{t("hourlyRateHint")}</p>
        {errorMessage("hourly_rate_azn") ? (
          <p className="mt-1.5 text-sm text-red-600">{errorMessage("hourly_rate_azn")}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="club_experience_text">{t("clubExperienceLabel")}</Label>
        <textarea
          id="club_experience_text"
          placeholder={t("clubExperiencePlaceholder")}
          rows={3}
          className="flex w-full rounded-lg border border-brand-dark/15 bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-muted-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
          {...form.register("club_experience_text")}
        />
        {errorMessage("club_experience_text") ? (
          <p className="mt-1.5 text-sm text-red-600">{errorMessage("club_experience_text")}</p>
        ) : null}
      </div>

      <StepFooter onBack={onBack} />
    </form>
  );
}
