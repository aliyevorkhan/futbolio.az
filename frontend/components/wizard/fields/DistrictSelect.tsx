"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { DISTRICT_CODES } from "@/lib/validation/shared/districts";
import { cn } from "@/lib/utils";

/**
 * Step 1's single district field is a plain native `<select>` (per the
 * spec) rather than Radix Select — Radix Select is the admin agent's
 * primitive to own, and a native select is simplest/fully accessible
 * here anyway. Step 3's availability districts use the chip multi-select
 * instead (`ChipMultiSelect`), since that one allows several districts.
 */
export const DistrictSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
  const t = useTranslations("wizard.districts");

  return (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-brand-dark/15 bg-white px-3.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 aria-[invalid=true]:border-red-500",
        className,
      )}
      {...props}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {DISTRICT_CODES.map((code) => (
        <option key={code} value={code}>
          {t(code)}
        </option>
      ))}
    </select>
  );
});
DistrictSelect.displayName = "DistrictSelect";
