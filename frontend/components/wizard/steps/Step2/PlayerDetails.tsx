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
  playerDetailsSchema,
  POSITION_VALUES,
  FOOT_VALUES,
  EXPERIENCE_YEARS_VALUES,
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

  const form = useForm<PlayerDetailsData>({
    resolver: zodResolver(playerDetailsSchema),
    mode: "onSubmit",
    defaultValues: {
      main_position: defaultValues.main_position,
      extra_positions: defaultValues.extra_positions ?? [],
      preferred_foot: defaultValues.preferred_foot,
      years_playing: defaultValues.years_playing,
      club_experience_text: defaultValues.club_experience_text ?? "",
      self_rating: defaultValues.self_rating,
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
  const ratingOptions = ["1", "2", "3", "4", "5"].map((value) => ({ value, label: value }));

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

      <Controller
        control={form.control}
        name="self_rating"
        render={({ field }) => (
          <ChipSingleSelect
            name="self_rating"
            label={t("selfRatingLabel")}
            value={field.value != null ? String(field.value) : undefined}
            onChange={(value) => field.onChange(Number(value))}
            options={ratingOptions}
            error={errorMessage("self_rating")}
            registerRef={registerField("self_rating")}
          />
        )}
      />

      <StepFooter onBack={onBack} />
    </form>
  );
}
