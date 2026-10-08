"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

/**
 * shadcn-style Radix radio-group primitive. Rendered as a wrapping row
 * of pill "chips" rather than classic dots+labels — Radix still gives
 * us real `role="radiogroup"`/`role="radio"` semantics and roving
 * keyboard focus underneath, we just restyle `Item`.
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-wrap gap-2", className)}
    {...props}
  />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupChip = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-brand-dark/15 bg-white px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-brand-dark/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 data-[state=checked]:border-brand-green data-[state=checked]:bg-brand-green data-[state=checked]:text-brand-dark",
      className,
    )}
    {...props}
  >
    {children}
  </RadioGroupPrimitive.Item>
));
RadioGroupChip.displayName = "RadioGroupChip";

export { RadioGroup, RadioGroupChip };
