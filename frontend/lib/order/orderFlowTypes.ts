/**
 * Order Flow (the "Sifariş et" wizard) — entirely frontend-only, no
 * backend persistence, no draft/localStorage, no file upload, no
 * Turnstile. A plain controlled-object answers state is proportionate
 * here (vs. `RegistrationWizard`'s heavier machinery), per the fix
 * round's explicit scope decision.
 */

export const ORDER_ROLE_VALUES = ["player", "goalkeeper", "referee", "medic", "full_rival_team"] as const;
export type OrderRole = (typeof ORDER_ROLE_VALUES)[number];

/** Roles a numeric stepper applies to — "full_rival_team" uses the team-size chips instead. */
export type CountableOrderRole = Exclude<OrderRole, "full_rival_team">;

export const TEAM_SIZE_VALUES = ["5x5", "6x6", "7x7", "8x8", "11x11"] as const;
export type TeamSize = (typeof TEAM_SIZE_VALUES)[number];

export const ORDER_LEVEL_VALUES = ["beginner", "intermediate", "advanced", "former_pro"] as const;
export type OrderLevel = (typeof ORDER_LEVEL_VALUES)[number];

export const ORDER_DURATION_VALUES = ["1h", "1_5h", "2h"] as const;
export type OrderDuration = (typeof ORDER_DURATION_VALUES)[number];

export const ORDER_PRICE_RANGE_VALUES = ["10_15", "15_20", "20_30", "30_plus", "any"] as const;
export type OrderPriceRange = (typeof ORDER_PRICE_RANGE_VALUES)[number];

export interface OrderAnswers {
  roles: OrderRole[];
  counts: Partial<Record<CountableOrderRole, number>>;
  teamSize?: TeamSize;
  level?: OrderLevel;
  date: string;
  time: string;
  duration?: OrderDuration;
  stadium: string;
  mapLink: string;
  priceRange?: OrderPriceRange;
  name: string;
  note: string;
}

export const EMPTY_ORDER_ANSWERS: OrderAnswers = {
  roles: [],
  counts: {},
  teamSize: undefined,
  level: undefined,
  date: "",
  time: "",
  duration: undefined,
  stadium: "",
  mapLink: "",
  priceRange: undefined,
  name: "",
  note: "",
};

export const ORDER_FLOW_TOTAL_STEPS = 6;
