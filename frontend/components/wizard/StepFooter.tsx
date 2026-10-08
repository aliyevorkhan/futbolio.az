"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/** Shared Back/Continue (or Submit) footer row used by every step 2-5. */
export function StepFooter({
  onBack,
  submitLabel,
  isSubmitting,
}: {
  onBack?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}) {
  const tNav = useTranslations("wizard.nav");

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {onBack ? (
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          {tNav("back")}
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? tNav("submitting") : (submitLabel ?? tNav("continue"))}
      </Button>
    </div>
  );
}
