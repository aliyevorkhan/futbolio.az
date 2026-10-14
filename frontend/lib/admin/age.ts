import { calculateAgeAtDate, parseIsoDateLocal } from "@/lib/validation/shared/dateOfBirth";

/** Age in whole years as of today, from a `YYYY-MM-DD` date_of_birth string. */
export function ageFromDateOfBirth(dateOfBirth: string): number | null {
  const dob = parseIsoDateLocal(dateOfBirth);
  if (!dob) return null;
  return calculateAgeAtDate(dob, new Date());
}
