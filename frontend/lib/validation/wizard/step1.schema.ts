import { z } from "zod";
import { PHONE_REGEX } from "../shared/phone";
import { DISTRICT_CODES } from "../shared/districts";
import { INSTAGRAM_HANDLE_REGEX, normalizeInstagramHandle } from "../shared/instagramHandle";
import { isAgeInRange, parseIsoDateLocal } from "../shared/dateOfBirth";

export const ROLE_VALUES = ["player", "referee", "medic"] as const;
export type Role = (typeof ROLE_VALUES)[number];

/** Maps the `?rol=` marketing query param to the backend's role codes. */
export const ROLE_QUERY_PARAM_MAP: Record<string, Role> = {
  futbolcu: "player",
  hakim: "referee",
  hekim: "medic",
};

// Azerbaijani Latin alphabet: standard A-Z plus Çç Əə Ğğ İı Öö Şş Üü.
const FULL_NAME_REGEX = /^[A-Za-zÇçƏəĞğİıÖöŞşÜü]+(?:[\s-][A-Za-zÇçƏəĞğİıÖöŞşÜü]+)*$/;

const dateOfBirthField = z
  .string({ required_error: "required" })
  .min(1, "required")
  .refine((value) => parseIsoDateLocal(value) !== null, "dateOfBirthRange")
  .refine((value) => {
    const dob = parseIsoDateLocal(value);
    return dob !== null && isAgeInRange(dob, new Date());
  }, "dateOfBirthRange");

export const step1Schema = z.object({
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
