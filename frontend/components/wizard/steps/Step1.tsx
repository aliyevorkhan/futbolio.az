"use client";

import * as React from "react";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DistrictSelect } from "@/components/wizard/fields/DistrictSelect";
import { StepFooter } from "@/components/wizard/StepFooter";
import { cn } from "@/lib/utils";
import { formatPhoneInput, toCanonicalPhone } from "@/lib/validation/shared/phone";
import {
  step1Schema,
  ROLE_VALUES,
  STEP1_FIELD_ORDER,
  type Step1Data,
  type Role,
} from "@/lib/validation/wizard/step1.schema";
import { useFocusFirstInvalidField } from "@/lib/validation/useFocusFirstInvalidField";

interface Step1Props {
  defaultValues: Partial<Step1Data>;
  onValid: (data: Step1Data) => void;
  onChange: (values: Partial<Step1Data>) => void;
}

export function Step1({ defaultValues, onValid, onChange }: Step1Props) {
  const t = useTranslations("wizard.step1");
  const tRoles = useTranslations("wizard.roles");
  const tErrors = useTranslations("wizard.errors");

  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: "onSubmit",
    defaultValues: {
      role: defaultValues.role,
      full_name: defaultValues.full_name ?? "",
      age: defaultValues.age,
      phone: defaultValues.phone ?? "",
      instagram_handle: defaultValues.instagram_handle ?? "",
      district: defaultValues.district,
    } as Step1Data,
  });

  useEffect(() => {
    const subscription = form.watch((values) => onChange(values as Partial<Step1Data>));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const { registerField, liveRegionRef } = useFocusFirstInvalidField(
    form.formState.errors as Record<string, { message?: unknown } | undefined>,
    STEP1_FIELD_ORDER,
  );

  const fullNameField = form.register("full_name");
  const ageField = form.register("age");
  const districtField = form.register("district");

  const errorMessage = (field: keyof Step1Data) => {
    const message = form.formState.errors[field]?.message;
    return message ? tErrors(message as string) : undefined;
  };

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onValid)}
      className="space-y-6"
    >
      <div ref={liveRegionRef} aria-live="assertive" role="alert" className="sr-only" />

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">{t("roleLabel")}</p>
        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <RadioGroupPrimitive.Root
              value={field.value}
              onValueChange={field.onChange}
              aria-label={t("roleLabel")}
              ref={registerField("role") as React.Ref<HTMLDivElement>}
              tabIndex={-1}
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {ROLE_VALUES.map((role: Role) => (
                <RadioGroupPrimitive.Item
                  key={role}
                  value={role}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border-2 border-brand-dark/15 bg-white px-4 py-5 text-center transition-colors hover:bg-brand-dark/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 data-[state=checked]:border-brand-green data-[state=checked]:bg-brand-green/10",
                  )}
                >
                  <span className="text-base font-semibold text-foreground">{tRoles(role)}</span>
                </RadioGroupPrimitive.Item>
              ))}
            </RadioGroupPrimitive.Root>
          )}
        />
        {errorMessage("role") ? (
          <p className="mt-2 text-sm text-red-600">{errorMessage("role")}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="full_name">{t("fullNameLabel")}</Label>
        <Input
          id="full_name"
          placeholder={t("fullNamePlaceholder")}
          aria-invalid={Boolean(form.formState.errors.full_name)}
          {...form.register("full_name")}
          ref={(el) => {
            fullNameField.ref(el);
            registerField("full_name")(el);
          }}
        />
        {errorMessage("full_name") ? (
          <p className="mt-1.5 text-sm text-red-600">{errorMessage("full_name")}</p>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="age">{t("ageLabel")}</Label>
          <Input
            id="age"
            type="number"
            inputMode="numeric"
            placeholder={t("agePlaceholder")}
            aria-invalid={Boolean(form.formState.errors.age)}
            {...ageField}
            ref={(el) => {
              ageField.ref(el);
              registerField("age")(el);
            }}
          />
          {errorMessage("age") ? (
            <p className="mt-1.5 text-sm text-red-600">{errorMessage("age")}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="phone">{t("phoneLabel")}</Label>
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <Input
                id="phone"
                inputMode="tel"
                placeholder={t("phonePlaceholder")}
                aria-invalid={Boolean(form.formState.errors.phone)}
                value={formatPhoneInput(field.value ?? "")}
                onChange={(event) => field.onChange(toCanonicalPhone(event.target.value))}
                onBlur={field.onBlur}
                ref={(el) => {
                  field.ref(el);
                  registerField("phone")(el);
                }}
              />
            )}
          />
          {errorMessage("phone") ? (
            <p className="mt-1.5 text-sm text-red-600">{errorMessage("phone")}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="instagram_handle">{t("instagramLabel")}</Label>
          <Controller
            control={form.control}
            name="instagram_handle"
            render={({ field }) => (
              <Input
                id="instagram_handle"
                placeholder={t("instagramPlaceholder")}
                aria-invalid={Boolean(form.formState.errors.instagram_handle)}
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value.replace(/^@/, ""))}
                onBlur={field.onBlur}
                ref={(el) => {
                  field.ref(el);
                  registerField("instagram_handle")(el);
                }}
              />
            )}
          />
          {errorMessage("instagram_handle") ? (
            <p className="mt-1.5 text-sm text-red-600">{errorMessage("instagram_handle")}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="district">{t("districtLabel")}</Label>
          <DistrictSelect
            id="district"
            placeholder={t("districtPlaceholder")}
            aria-invalid={Boolean(form.formState.errors.district)}
            {...districtField}
            ref={(el) => {
              districtField.ref(el);
              registerField("district")(el);
            }}
          />
          {errorMessage("district") ? (
            <p className="mt-1.5 text-sm text-red-600">{errorMessage("district")}</p>
          ) : null}
        </div>
      </div>

      <StepFooter />
    </form>
  );
}
