/**
 * Age-as-of-today calculation shared between Step 1's date-of-birth
 * field and its `min`/`max` picker bounds. Must stay in exact lockstep
 * with the backend's `common.age_limits.AGE_LIMITS`/`is_age_in_range_for_role`
 * (`today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))`)
 * — the implementation below is equivalent tuple-comparison logic, just
 * spelled out without relying on JS tuple comparisons.
 */
// Not imported from step1.schema.ts (which itself imports from this file)
// to avoid a circular dependency — kept as a literal union mirroring that
// file's own `Role` type.
export type RegistrationRole = "player" | "referee" | "medic";

export const AGE_LIMITS: Record<RegistrationRole, { min: number; max: number }> = {
  player: { min: 18, max: 45 },
  referee: { min: 18, max: 55 },
  medic: { min: 18, max: 75 },
};

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

/**
 * The native `<input type="date">`'s own `min`/`max` HTML attributes are
 * deliberately NOT role-specific, even though the real allowed range is
 * (enforced by isAgeInRange()/the zod schema on submit, and again by the
 * backend). A role-narrow min/max here previously caused the browser's
 * own native date-segment-typing behavior to misbehave for some
 * users/browsers (reported: typing a 4-digit year got cut off after the
 * 3rd digit) — switching every role to this one shared, generous range
 * removes that interaction entirely without weakening the real
 * enforcement, which never depended on this attribute.
 */
const WIDEST_MAX_AGE = Math.max(...Object.values(AGE_LIMITS).map((limit) => limit.max));
const WIDEST_MIN_AGE = Math.min(...Object.values(AGE_LIMITS).map((limit) => limit.min));

/** The oldest birth date across every role's range (today - widest max age), as `YYYY-MM-DD`. */
export function getMinBirthDateString(today: Date): string {
  const date = new Date(today);
  date.setFullYear(date.getFullYear() - WIDEST_MAX_AGE);
  return toIsoDateString(date);
}

/** The youngest birth date across every role's range (today - narrowest min age), as `YYYY-MM-DD`. */
export function getMaxBirthDateString(today: Date): string {
  const date = new Date(today);
  date.setFullYear(date.getFullYear() - WIDEST_MIN_AGE);
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

export function isAgeInRange(role: RegistrationRole, dob: Date, today: Date): boolean {
  const age = calculateAgeAtDate(dob, today);
  const { min, max } = AGE_LIMITS[role];
  return age >= min && age <= max;
}
