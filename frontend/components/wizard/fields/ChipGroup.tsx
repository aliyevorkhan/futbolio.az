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
}

/**
 * Multi-select chip group (checkbox semantics) — used for extra
 * positions, game types, and every Step 3 availability field (days,
 * hours, districts).
 */
export function ChipMultiSelect({
  label,
  values,
  onChange,
  options,
  error,
  registerRef,
  className,
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
        className={cn("flex flex-wrap gap-2")}
      >
        {options.map((option) => (
          <ChipCheckbox
            key={option.value}
            checked={values.includes(option.value)}
            onCheckedChange={(checked) => toggle(option.value, checked)}
          >
            {option.label}
          </ChipCheckbox>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
