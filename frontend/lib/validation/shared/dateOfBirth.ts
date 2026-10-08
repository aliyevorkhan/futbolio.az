/**
 * Age-as-of-today calculation shared between Step 1's date-of-birth
 * field and its `min`/`max` picker bounds. Must stay in exact lockstep
 * with the backend's `common.validators.validate_date_of_birth`
 * (`today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))`)
 * — the implementation below is equivalent tuple-comparison logic, just
 * spelled out without relying on JS tuple comparisons.
 */
export const MIN_AGE = 18;
export const MAX_AGE = 45;

/** Age in whole years as of `today`, matching the backend's calculation exactly. */
export function calculateAgeAtDate(dob: Date, today: Date): number {
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** The oldest allowed birth date (today - MAX_AGE years), as `YYYY-MM-DD`. */
export function getMinBirthDateString(today: Date): string {
  const date = new Date(today);
  date.setFullYear(date.getFullYear() - MAX_AGE);
  return toIsoDateString(date);
}

/** The youngest allowed birth date (today - MIN_AGE years), as `YYYY-MM-DD`. */
export function getMaxBirthDateString(today: Date): string {
  const date = new Date(today);
  date.setFullYear(date.getFullYear() - MIN_AGE);
  return toIsoDateString(date);
}

/** Parses a `YYYY-MM-DD` string as a local (not UTC) date, or `null` if malformed. */
export function parseIsoDateLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(year, month - 1, day);
  // Reject overflowed values like "2023-02-30" (Date would roll it to March).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function isAgeInRange(dob: Date, today: Date): boolean {
  const age = calculateAgeAtDate(dob, today);
  return age >= MIN_AGE && age <= MAX_AGE;
}
