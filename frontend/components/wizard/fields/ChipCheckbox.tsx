"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pill-styled checkbox built on the same Radix checkbox primitive as
 * `components/ui/checkbox.tsx`, just restyled as a chip to match
 * `RadioGroupChip`'s visual language for multi-select groups.
 */
export function ChipCheckbox({
  checked,
  onCheckedChange,
  children,
  className,
  disabled,
  title,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-full border border-brand-dark/15 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-brand-dark/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 data-[state=checked]:border-brand-green data-[state=checked]:bg-brand-green data-[state=checked]:text-brand-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white",
        className,
      )}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
      {children}
    </CheckboxPrimitive.Root>
  );
}
