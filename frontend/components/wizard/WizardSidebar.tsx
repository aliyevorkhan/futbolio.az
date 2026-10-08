"use client";

import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "complete" | "current" | "upcoming" | "error";

export interface WizardStepMeta {
  step: number;
  title: string;
  status?: StepStatus;
}

/**
 * Left sidebar on desktop (>=768px), horizontal top bar on mobile — one
 * component, responsive via Tailwind rather than two separate ones,
 * since the only difference is flex direction/sizing. Every step item
 * is a real `<button>` so any step is freely jumpable (no validation
 * gate — the owner's explicit preference for unrestricted navigation).
 */
export function WizardSidebar({
  steps,
  currentStep,
  progressLabel,
  onStepClick,
}: {
  steps: WizardStepMeta[];
  currentStep: number;
  progressLabel: string;
  onStepClick?: (step: number) => void;
}) {
  return (
    <nav aria-label={progressLabel} className="mb-8 md:mb-0 md:w-56 md:shrink-0">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted md:hidden">
        {progressLabel}
      </p>
      <ol className="flex gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
        {steps.map((step) => {
          const status: StepStatus = step.status ?? (step.step < currentStep ? "complete" : step.step === currentStep ? "current" : "upcoming");
          const isComplete = status === "complete";
          const isCurrent = status === "current";
          const isError = status === "error";
          return (
            <li key={step.step} className="shrink-0 md:shrink">
              <button
                type="button"
                onClick={() => onStepClick?.(step.step)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-left text-sm font-medium transition-colors md:rounded-lg",
                  isCurrent && "bg-brand-green/15 text-brand-dark",
                  isComplete && "text-foreground",
                  isError && "text-red-600",
                  !isCurrent && !isComplete && !isError && "text-muted",
                  "hover:bg-brand-dark/5",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isComplete && "border-brand-green bg-brand-green text-brand-dark",
                    isCurrent && "border-brand-green text-brand-dark",
                    isError && "border-red-500 bg-red-50 text-red-600",
                    !isCurrent && !isComplete && !isError && "border-brand-dark/20 text-muted",
                  )}
                >
                  {isError ? (
                    <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : isComplete ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    step.step
                  )}
                </span>
                <span className="whitespace-nowrap md:whitespace-normal">{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
