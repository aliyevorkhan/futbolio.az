"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStepMeta {
  step: number;
  title: string;
}

/**
 * Left sidebar on desktop (>=768px), horizontal top bar on mobile — one
 * component, responsive via Tailwind rather than two separate ones,
 * since the only difference is flex direction/sizing.
 */
export function WizardSidebar({
  steps,
  currentStep,
  progressLabel,
}: {
  steps: WizardStepMeta[];
  currentStep: number;
  progressLabel: string;
}) {
  return (
    <nav aria-label={progressLabel} className="mb-8 md:mb-0 md:w-56 md:shrink-0">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted md:hidden">
        {progressLabel}
      </p>
      <ol className="flex gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
        {steps.map((step) => {
          const isComplete = step.step < currentStep;
          const isCurrent = step.step === currentStep;
          return (
            <li key={step.step} className="shrink-0 md:shrink">
              <div
                className={cn(
                  "flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium md:rounded-lg",
                  isCurrent && "bg-brand-green/15 text-brand-dark",
                  isComplete && "text-foreground",
                  !isCurrent && !isComplete && "text-muted",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isComplete && "border-brand-green bg-brand-green text-brand-dark",
                    isCurrent && "border-brand-green text-brand-dark",
                    !isCurrent && !isComplete && "border-brand-dark/20 text-muted",
                  )}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.step}
                </span>
                <span className="whitespace-nowrap md:whitespace-normal">{step.title}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
