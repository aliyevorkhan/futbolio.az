"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { useTranslations } from "next-intl";
import { Goal, Flag, Stethoscope, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DistrictSelect } from "@/components/wizard/fields/DistrictSelect";
import { StepFooter } from "@/components/wizard/StepFooter";
import { cn } from "@/lib/utils";
import { formatNationalPart, toCanonicalPhone } from "@/lib/validation/shared/phone";
import { getMinBirthDateString, getMaxBirthDateString } from "@/lib/validation/shared/dateOfBirth";
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

// Tentative role icon choices — pick your own reasonable mapping if the
// home page's design-system rebuild settles on different lucide icons
// for the "Xidmətlər" cards; this is a low-stakes cosmetic detail worth
// unifying later, not a blocker now. No lucide icon named "whistle"
// exists in the installed version, hence `Flag` for referee.
const ROLE_ICONS: Record<Role, LucideIcon> = {
  player: Goal,
  referee: Flag,
  medic: Stethoscope,
};

export function Step1({ defaultValues, onValid, onChange }: Step1Props) {
  const t = useTranslations("wizard.step1");
  const tRoot = useTranslations("wizard");
  const tRoles = useTranslations("wizard.roles");
  const tErrors = useTranslations("wizard.errors");

  // Client-only min/max bounds for the date-of-birth picker — computed
  // from `new Date()`, so they must only be applied post-mount to avoid
  // an SSR/hydration mismatch (same caution as this codebase's
  // localStorage-restore pattern elsewhere).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [minBirthDate, maxBirthDate] = useMemo(() => {
    const today = new Date();
    return [getMinBirthDateString(today), getMaxBirthDateString(today)];
  }, []);

  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: "onSubmit",
    defaultValues: {
      role: defaultValues.role,
      full_name: defaultValues.full_name ?? "",
      date_of_birth: defaultValues.date_of_birth ?? "",
      phone: defaultValues.phone ?? "",
      instagram_handle: defaultValues.instagram_handle ?? "",
      district: defaultValues.district,
    } as Step1Data,
  });

  const role = form.watch("role");

  useEffect(() => {
    const subscription = form.watch((values) => onChange(values as Partial<Step1Data>));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Only the player role collects an Instagram handle — the backend
  // actively rejects a non-blank value for referee/medic submissions —
  // so clear any stray value the moment the user switches away from it.
  useEffect(() => {
    if (role !== "player" && form.getValues("instagram_handle")) {
      form.setValue("instagram_handle", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const { registerField, liveRegionRef } = useFocusFirstInvalidField(
    form.formState.errors as Record<string, { message?: unknown } | undefined>,
    STEP1_FIELD_ORDER,
  );

  const fullNameField = form.register("full_name");
  const dateOfBirthField = form.register("date_of_birth");
  const districtField = form.register("district");

  const errorMessage = (field: keyof Step1Data) => {
    const message = form.formState.errors[field]?.message;
    return message ? tErrors(message as string) : undefined;
  };

  const RoleIcon = role ? ROLE_ICONS[role] : null;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onValid)}
      className="space-y-6"
    >
      <div ref={liveRegionRef} aria-live="assertive" role="alert" className="sr-only" />

      {/* Role-dependent visual region: icon + role-aware title, remounted
          (and so CSS-animated) on every role change via `key={role}`. */}
      <div
        key={role ?? "none"}
        className="animate-role-fade-in flex items-center gap-3 rounded-xl bg-brand-green/10 px-4 py-3"
      >
        {RoleIcon ? (
          <RoleIcon className="h-6 w-6 shrink-0 text-brand-dark" aria-hidden="true" />
        ) : null}
        <p className="font-heading text-base font-semibold text-foreground">
          {tRoot(role ? `roleTitles.${role}` : "meta.title")}
        </p>
      </div>

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
              {ROLE_VALUES.map((roleValue: Role) => (
                <RadioGroupPrimitive.Item
                  key={roleValue}
                  value={roleValue}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border-2 border-brand-dark/15 bg-white px-4 py-5 text-center transition-colors hover:bg-brand-dark/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 data-[state=checked]:border-brand-green data-[state=checked]:bg-brand-green/10",
                  )}
                >
                  <span className="text-base font-semibold text-foreground">{tRoles(roleValue)}</span>
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
          <Label htmlFor="date_of_birth">{t("dateOfBirthLabel")}</Label>
          <Input
            id="date_of_birth"
            type="date"
            min={mounted ? minBirthDate : undefined}
            max={mounted ? maxBirthDate : undefined}
            aria-invalid={Boolean(form.formState.errors.date_of_birth)}
            {...dateOfBirthField}
            ref={(el) => {
              dateOfBirthField.ref(el);
              registerField("date_of_birth")(el);
            }}
          />
          {errorMessage("date_of_birth") ? (
            <p className="mt-1.5 text-sm text-red-600">{errorMessage("date_of_birth")}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="phone">{t("phoneLabel")}</Label>
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <div
                className={cn(
                  "flex h-11 overflow-hidden rounded-lg border border-brand-dark/15 bg-white focus-within:ring-2 focus-within:ring-brand-dark focus-within:ring-offset-2",
                  Boolean(form.formState.errors.phone) && "border-red-500",
                )}
              >
                <span className="flex shrink-0 select-none items-center border-r border-brand-dark/15 bg-brand-dark/5 px-3 text-sm font-medium text-muted">
                  +994
                </span>
                <input
                  id="phone"
                  inputMode="tel"
                  placeholder="XX XXX XX XX"
                  aria-invalid={Boolean(form.formState.errors.phone)}
                  value={formatNationalPart(field.value ?? "")}
                  onChange={(event) => field.onChange(toCanonicalPhone(`994${event.target.value}`))}
                  onBlur={field.onBlur}
                  className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm text-foreground placeholder:text-muted-2 focus-visible:outline-none"
                  ref={(el) => {
                    field.ref(el);
                    registerField("phone")(el);
                  }}
                />
              </div>
            )}
          />
          {errorMessage("phone") ? (
            <p className="mt-1.5 text-sm text-red-600">{errorMessage("phone")}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {role === "player" ? (
          <div key={role ?? "none"} className="animate-role-fade-in">
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
        ) : null}

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
