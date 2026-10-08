import {
  AccordionContent,
  AccordionItem as BaseAccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * FAQ-specific wrapper around the generic Radix accordion primitives in
 * `components/ui/accordion.tsx`. Keeps `SuallarSection.tsx` terse.
 */
export function AccordionFaqItem({
  value,
  question,
  answer,
}: {
  value: string;
  question: string;
  answer: string;
}) {
  return (
    <BaseAccordionItem value={value}>
      <AccordionTrigger>{question}</AccordionTrigger>
      <AccordionContent>{answer}</AccordionContent>
    </BaseAccordionItem>
  );
}
