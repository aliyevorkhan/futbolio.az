"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrderAnswers } from "@/lib/order/orderFlowTypes";

interface OrderStepContactProps {
  answers: OrderAnswers;
  onChange: (patch: Partial<OrderAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

/** Step 6: contact name (required — can't build a sensible WhatsApp message without an identifier) + optional note. */
export function OrderStepContact({ answers, onChange, onNext, onBack }: OrderStepContactProps) {
  const t = useTranslations("order");
  const tNav = useTranslations("order.nav");

  const isValid = Boolean(answers.name.trim());

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground">{t("contact.title")}</h2>
      <p className="mb-5 text-sm text-muted">{t("contact.description")}</p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="order_name">{t("contact.nameLabel")}</Label>
          <Input
            id="order_name"
            placeholder={t("contact.namePlaceholder")}
            value={answers.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="order_note">{t("contact.noteLabel")}</Label>
          <textarea
            id="order_note"
            placeholder={t("contact.notePlaceholder")}
            rows={3}
            className="flex w-full rounded-lg border border-brand-dark/15 bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-muted-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
            value={answers.note}
            onChange={(event) => onChange({ note: event.target.value })}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          {tNav("back")}
        </Button>
        <Button type="button" variant="dark-solid" size="lg" disabled={!isValid} onClick={onNext}>
          {t("contact.reviewButton")}
        </Button>
      </div>
    </div>
  );
}
