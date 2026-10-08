"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { OrderStepper } from "./OrderStepper";
import { OrderStepRoles } from "./OrderStepRoles";
import { OrderStepCounts } from "./OrderStepCounts";
import { OrderStepLevel } from "./OrderStepLevel";
import { OrderStepGameDetails } from "./OrderStepGameDetails";
import { OrderStepPriceRange } from "./OrderStepPriceRange";
import { OrderStepContact } from "./OrderStepContact";
import { OrderSummary } from "./OrderSummary";
import {
  EMPTY_ORDER_ANSWERS,
  ORDER_FLOW_TOTAL_STEPS,
  type OrderAnswers,
  type OrderRole,
} from "@/lib/order/orderFlowTypes";

interface OrderFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-ticks this role in Step 1 when opened from a specific "Sifariş et" card. */
  initialRole?: OrderRole;
}

/**
 * The "Sifariş et" order wizard — entirely frontend-only (no backend
 * persistence, no draft/localStorage, no file upload, no Turnstile), so
 * it's deliberately NOT built on `RegistrationWizard`'s heavier
 * machinery. A local `useState` step index + plain controlled answers
 * object is proportionate here.
 */
export function OrderFlowModal({ open, onOpenChange, initialRole }: OrderFlowModalProps) {
  const t = useTranslations("order");
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<OrderAnswers>(EMPTY_ORDER_ANSWERS);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Reset to a clean step 1 every time the modal is (re)opened, with
      // that card's role pre-ticked.
      setStep(1);
      setAnswers({ ...EMPTY_ORDER_ANSWERS, roles: initialRole ? [initialRole] : [] });
    }
    onOpenChange(next);
  };

  const update = (patch: Partial<OrderAnswers>) => setAnswers((prev) => ({ ...prev, ...patch }));
  const goNext = () => setStep((current) => Math.min(current + 1, ORDER_FLOW_TOTAL_STEPS + 1));
  const goBack = () => setStep((current) => Math.max(current - 1, 1));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-lg">
        <DialogTitle className="sr-only">{t("modalTitle")}</DialogTitle>

        {step <= ORDER_FLOW_TOTAL_STEPS ? (
          <div className="mb-5">
            <OrderStepper currentStep={step} totalSteps={ORDER_FLOW_TOTAL_STEPS} />
          </div>
        ) : null}

        {step === 1 ? (
          <OrderStepRoles
            value={answers.roles}
            onChange={(roles) => update({ roles })}
            onNext={goNext}
          />
        ) : null}
        {step === 2 ? (
          <OrderStepCounts answers={answers} onChange={update} onNext={goNext} onBack={goBack} />
        ) : null}
        {step === 3 ? (
          <OrderStepLevel
            value={answers.level}
            onChange={(level) => update({ level })}
            onNext={goNext}
            onBack={goBack}
          />
        ) : null}
        {step === 4 ? (
          <OrderStepGameDetails answers={answers} onChange={update} onNext={goNext} onBack={goBack} />
        ) : null}
        {step === 5 ? (
          <OrderStepPriceRange
            value={answers.priceRange}
            onChange={(priceRange) => update({ priceRange })}
            onNext={goNext}
            onBack={goBack}
          />
        ) : null}
        {step === 6 ? (
          <OrderStepContact answers={answers} onChange={update} onNext={goNext} onBack={goBack} />
        ) : null}
        {step === 7 ? <OrderSummary answers={answers} onBack={goBack} /> : null}
      </DialogContent>
    </Dialog>
  );
}
