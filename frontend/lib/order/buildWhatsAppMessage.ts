import type { OrderAnswers, OrderRole, OrderLevel, OrderDuration, OrderPriceRange } from "./orderFlowTypes";

/** Display-text lookups the caller resolves via `useTranslations()` — kept out of this pure function so it stays easily testable. */
export interface OrderMessageLabels {
  role: Record<OrderRole, string>;
  level: Record<OrderLevel, string>;
  duration: Record<OrderDuration, string>;
  priceRange: Record<OrderPriceRange, string>;
  template: {
    greeting: string;
    needLabel: string;
    levelLabel: string;
    dateTimeLabel: string;
    stadiumLabel: string;
    priceLabel: string;
    nameLabel: string;
    noteLabel: string;
  };
}

/**
 * Assembles the WhatsApp message template from the Order Flow's answers,
 * localized per the current locale via `labels.template` (resolved by the
 * caller through `useTranslations("order.whatsapp")`). Returns plain text
 * — NOT `encodeURIComponent`-encoded here, since `lib/utils.ts`'s
 * `buildWhatsAppUrl(number, text)` (the existing single source of truth
 * every other CTA on the site already uses) does that encoding itself;
 * encoding twice would double-escape the message.
 */
export function buildWhatsAppMessage(answers: OrderAnswers, labels: OrderMessageLabels): string {
  const { template } = labels;

  const roleLines = answers.roles.map((role) => {
    if (role === "full_rival_team") {
      return answers.teamSize ? `${labels.role.full_rival_team} (${answers.teamSize})` : labels.role.full_rival_team;
    }
    const count = answers.counts[role] ?? 1;
    return `${count} ${labels.role[role]}`;
  });

  const lines = [
    template.greeting,
    `${template.needLabel}: ${roleLines.join(", ")}`,
    `${template.levelLabel}: ${answers.level ? labels.level[answers.level] : ""}`,
    `${template.dateTimeLabel}: ${answers.date}, ${answers.time}, ${answers.duration ? labels.duration[answers.duration] : ""}`,
    `${template.stadiumLabel}: ${answers.stadium}${answers.mapLink ? ` (${answers.mapLink})` : ""}`,
    `${template.priceLabel}: ${answers.priceRange ? labels.priceRange[answers.priceRange] : ""}`,
    `${template.nameLabel}: ${answers.name}`,
  ];

  if (answers.note.trim()) {
    lines.push(`${template.noteLabel}: ${answers.note.trim()}`);
  }

  return lines.join("\n");
}
