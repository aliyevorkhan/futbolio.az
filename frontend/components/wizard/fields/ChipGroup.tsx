"use client";

import * as React from "react";
import { RadioGroup, RadioGroupChip } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { ChipCheckbox } from "./ChipCheckbox";

export interface ChipOption {
  value: string;
  label: string;
}

interface ChipSingleSelectProps {
  name: string;
  label?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: ChipOption[];
  error?: string;
  registerRef?: (el: HTMLElement | null) => void;
  className?: string;
}

/**
 * Single-select chip group with real `role="radiogroup"`/`role="radio"`
 * semantics (via Radix RadioGroup) — used for every Step 2/3 chip field
 * that picks exactly one option (main position, preferred foot, years
 * of experience, license status, specialty...).
 */
export function ChipSingleSelect({
  name,
  label,
  value,
  onChange,
  options,
  error,
  registerRef,
  className,
}: ChipSingleSelectProps) {
  return (
    <div className={className}>
      {label ? <p className="mb-2 text-sm font-medium text-foreground">{label}</p> : null}
      <RadioGroup
        value={value}
        onValueChange={onChange}
        aria-label={label}
        aria-invalid={Boolean(error)}
        ref={registerRef as React.Ref<HTMLDivElement>}
        tabIndex={-1}
        name={name}
        className={cn(error && "rounded-lg border-2 border-red-500 p-2")}
      >
        {options.map((option) => (
          <RadioGroupChip key={option.value} value={option.value}>
            {option.label}
          </RadioGroupChip>
        ))}
      </RadioGroup>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

interface ChipMultiSelectProps {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: ChipOption[];
  error?: string;
  registerRef?: (el: HTMLElement | null) => void;
  className?: string;
  /** Option values rendered disabled (with a tooltip via `disabledTitle`) — e.g. a player's main position inside the "extra positions" picker. */
  disabledValues?: string[];
  disabledTitle?: string;
}

/**
 * Multi-select chip group (checkbox semantics) — used for extra
 * positions, game types, medic specialties, and (pre-Availability-grid)
 * Step 3's old flat days/hours/districts fields.
 */
export function ChipMultiSelect({
  label,
  values,
  onChange,
  options,
  error,
  registerRef,
  className,
  disabledValues,
  disabledTitle,
}: ChipMultiSelectProps) {
  const toggle = (optionValue: string, checked: boolean) => {
    onChange(
      checked ? [...values, optionValue] : values.filter((v) => v !== optionValue),
    );
  };

  return (
    <div className={className}>
      {label ? <p className="mb-2 text-sm font-medium text-foreground">{label}</p> : null}
      <div
        role="group"
        aria-label={label}
        ref={registerRef as React.Ref<HTMLDivElement>}
        tabIndex={-1}
        className={cn("flex flex-wrap gap-2", error && "rounded-lg border-2 border-red-500 p-2")}
      >
        {options.map((option) => {
          const isDisabled = disabledValues?.includes(option.value) ?? false;
          return (
            <ChipCheckbox
              key={option.value}
              checked={values.includes(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked)}
              disabled={isDisabled}
              title={isDisabled ? disabledTitle : undefined}
            >
              {option.label}
            </ChipCheckbox>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
