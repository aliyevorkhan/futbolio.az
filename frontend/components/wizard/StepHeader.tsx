"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";

/**
 * Shared `<h2>` + "Geri qayıt" row used at the top of steps 2-5 (step 1
 * has no back target). This coexists with — doesn't replace —
 * `StepFooter`'s bottom-of-form Back button; both call the same
 * `onBack` the step already threads through.
 */
export function StepHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const tNav = useTranslations("wizard.nav");

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-muted transition-colors hover:bg-brand-dark/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {tNav("back")}
        </button>
      ) : null}
    </div>
  );
}
