import { z } from "zod";

// `.refine` (not `z.literal(true)`) keeps the field's TS type as plain
// `boolean` on both input and output — these start unchecked (`false`)
// in the form, so a literal-`true` type would make that initial value
// unrepresentable.
export const step5Schema = z.object({
  data_processing_consent: z.boolean().refine((value) => value === true, "consentRequired"),
  social_share_consent: z.boolean(),
  age_confirmation_consent: z.boolean().refine((value) => value === true, "consentRequired"),
  // Honeypot — must stay untouched. Server-validated too; this is just
  // so the field participates in the same form state.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type Step5Data = z.infer<typeof step5Schema>;

export const STEP5_FIELD_ORDER: (keyof Step5Data)[] = [
  "data_processing_consent",
  "age_confirmation_consent",
];
