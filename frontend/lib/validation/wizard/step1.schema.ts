import { z } from "zod";
import { PHONE_REGEX } from "../shared/phone";
import { DISTRICT_CODES } from "../shared/districts";
import { INSTAGRAM_HANDLE_REGEX, normalizeInstagramHandle } from "../shared/instagramHandle";
import { AGE_LIMITS, isAgeInRange, parseIsoDateLocal } from "../shared/dateOfBirth";

export const ROLE_VALUES = ["player", "referee", "medic"] as const;
export type Role = (typeof ROLE_VALUES)[number];

/** Maps the `?rol=` marketing query param to the backend's role codes. */
export const ROLE_QUERY_PARAM_MAP: Record<string, Role> = {
  futbolcu: "player",
  hakim: "referee",
  hekim: "medic",
};

/** Per-role date-of-birth-out-of-range error key, resolved against `wizard.errors`. */
const ROLE_AGE_ERROR_KEY: Record<Role, string> = {
  player: "dateOfBirthRangePlayer",
  referee: "dateOfBirthRangeReferee",
  medic: "dateOfBirthRangeMedic",
};

// Azerbaijani Latin alphabet: standard A-Z plus Çç Əə Ğğ İı Öö Şş Üü.
const FULL_NAME_REGEX = /^[A-Za-zÇçƏəĞğİıÖöŞşÜü]+(?:[\s-][A-Za-zÇçƏəĞğİıÖöŞşÜü]+)*$/;

// The age-range check itself can't live here — it needs the sibling `role`
// field, so it's a superRefine on the whole object below instead. This
// field-level refine only checks the date itself is well-formed.
const dateOfBirthField = z
  .string({ required_error: "required" })
  .min(1, "required")
  .refine((value) => parseIsoDateLocal(value) !== null, "dateOfBirthRange");

export const step1Schema = z
  .object({
    role: z.enum(ROLE_VALUES, { required_error: "required", invalid_type_error: "required" }),
    full_name: z
      .string({ required_error: "required" })
      .trim()
      .min(3, "invalidFullName")
      .max(80, "invalidFullName")
      .regex(FULL_NAME_REGEX, "invalidFullName"),
    date_of_birth: dateOfBirthField,
    phone: z
      .string({ required_error: "required" })
      .transform((value) => value.trim())
      .refine((value) => PHONE_REGEX.test(value), "invalidPhone"),
    instagram_handle: z
      .string()
      .optional()
      .transform((value) => (value ? normalizeInstagramHandle(value) : value))
      .refine((value) => !value || INSTAGRAM_HANDLE_REGEX.test(value), "invalidInstagramHandle"),
    district: z.enum(DISTRICT_CODES, { required_error: "required", invalid_type_error: "required" }),
  })
  .superRefine((data, ctx) => {
    if (!AGE_LIMITS[data.role]) return; // role itself already flagged above
    const dob = parseIsoDateLocal(data.date_of_birth);
    if (!dob) return; // date itself already flagged by dateOfBirthField's own refine
    if (!isAgeInRange(data.role, dob, new Date())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: ROLE_AGE_ERROR_KEY[data.role], path: ["date_of_birth"] });
    }
  });

export type Step1Data = z.infer<typeof step1Schema>;

export const STEP1_FIELD_ORDER: (keyof Step1Data)[] = [
  "role",
  "full_name",
  "date_of_birth",
  "phone",
  "instagram_handle",
  "district",
];
