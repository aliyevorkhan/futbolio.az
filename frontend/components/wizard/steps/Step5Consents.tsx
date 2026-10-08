"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { StepHeader } from "@/components/wizard/StepHeader";
import { StepFooter } from "@/components/wizard/StepFooter";
import { TurnstileWidget, honeypotFieldProps } from "@/components/wizard/TurnstileWidget";
import { useFocusFirstInvalidField } from "@/lib/validation/useFocusFirstInvalidField";
import {
  step5Schema,
  STEP5_FIELD_ORDER,
  type Step5Data,
} from "@/lib/validation/wizard/step5.schema";

interface Step5Props {
  defaultValues: Partial<Step5Data>;
  onValid: (data: Step5Data, turnstileToken: string) => void;
  onChange: (values: Partial<Step5Data>) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function Step5Consents({
  defaultValues,
  onValid,
  onChange,
  onBack,
  isSubmitting,
}: Step5Props) {
  const t = useTranslations("wizard.step5");
  const tErrors = useTranslations("wizard.errors");
  const tNav = useTranslations("wizard.nav");

  const [turnstileToken, setTurnstileToken] = useState("");

  const form = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
    mode: "onSubmit",
    defaultValues: {
      // Never pre-checked, per spec — even on draft restore.
      data_processing_consent: false,
      social_share_consent: defaultValues.social_share_consent ?? false,
      age_confirmation_consent: false,
      website: "",
    } as Step5Data,
  });

  useEffect(() => {
    const subscription = form.watch((values) => onChange(values as Partial<Step5Data>));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const { registerField, liveRegionRef } = useFocusFirstInvalidField(
    form.formState.errors as Record<string, { message?: unknown } | undefined>,
    STEP5_FIELD_ORDER,
  );

  const errorMessage = (field: keyof Step5Data) => {
    const message = form.formState.errors[field]?.message;
    return message ? tErrors(message as string) : undefined;
  };

  return (
    <div>
      <StepHeader title={t("title")} onBack={onBack} />
      <p className="mb-6 text-muted">{t("description")}</p>

      <form
        noValidate
        onSubmit={form.handleSubmit((data) => onValid(data, turnstileToken))}
        className="space-y-5"
      >
        <div ref={liveRegionRef} aria-live="assertive" role="alert" className="sr-only" />

        <Controller
          control={form.control}
          name="data_processing_consent"
          render={({ field }) => (
            <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-invalid={Boolean(form.formState.errors.data_processing_consent)}
                ref={registerField("data_processing_consent")}
              />
              <span className="text-sm text-foreground">
                {t.rich("dataProcessingLabel", {
                  link: (chunks) => (
                    <Link href="/mexfilik" target="_blank" className="font-medium text-brand-green underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            </label>
          )}
        />
        {errorMessage("data_processing_consent") ? (
          <p className="text-sm text-red-600">{errorMessage("data_processing_consent")}</p>
        ) : null}

        <Controller
          control={form.control}
          name="social_share_consent"
          render={({ field }) => (
            <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              <span className="text-sm text-foreground">{t("socialShareLabel")}</span>
            </label>
          )}
        />

        <Controller
          control={form.control}
          name="age_confirmation_consent"
          render={({ field }) => (
            <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-invalid={Boolean(form.formState.errors.age_confirmation_consent)}
                ref={registerField("age_confirmation_consent")}
              />
              <span className="text-sm text-foreground">{t("ageConfirmationLabel")}</span>
            </label>
          )}
        />
        {errorMessage("age_confirmation_consent") ? (
          <p className="text-sm text-red-600">{errorMessage("age_confirmation_consent")}</p>
        ) : null}

        {/* Honeypot: real, rendered, off-screen — not display:none/type=hidden. */}
        <input type="text" {...honeypotFieldProps()} {...form.register("website")} />

        <TurnstileWidget onToken={setTurnstileToken} />

        <StepFooter onBack={onBack} submitLabel={tNav("submit")} isSubmitting={isSubmitting} />
      </form>
    </div>
  );
}
