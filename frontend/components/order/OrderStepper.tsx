"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Lightweight progress indicator for the Order Flow modal — much
 * simpler than `WizardSidebar` (no per-step labels/status, just dots +
 * a text readout), proportionate to a 6-step, frontend-only flow.
 */
export function OrderStepper({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const t = useTranslations("order");

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5" role="presentation">
        {Array.from({ length: totalSteps }, (_, index) => index + 1).map((step) => (
          <span
            key={step}
            className={cn(
              "h-1.5 w-6 rounded-full transition-colors",
              step <= currentStep ? "bg-brand-green" : "bg-brand-dark/10",
            )}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-muted">
        {t("stepper", { current: currentStep, total: totalSteps })}
      </p>
    </div>
  );
}
