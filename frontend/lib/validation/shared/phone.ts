/**
 * Azerbaijani mobile numbers accepted by the backend: `+994` followed by
 * one of the mobile operator prefixes below, then 7 digits. Keep this in
 * sync with the DRF serializer's phone validator.
 */
export const PHONE_REGEX = /^\+994(10|50|51|55|60|70|77|99)\d{7}$/;

/**
 * Strip everything but digits from a user-typed string and reassemble
 * the canonical `+994XXXXXXXXX` form, used both for the as-you-type mask
 * (`formatPhoneInput`) and before validation/submission.
 */
export function toCanonicalPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00994")) digits = digits.slice(2);
  if (digits.startsWith("994")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  return digits ? `+994${digits}` : "";
}

/**
 * As-you-type mask for the Step 1 phone field: groups the 9 national
 * digits as `XX XXX XX XX` after the fixed `+994` prefix, mirroring
 * `formatPhone` in `lib/utils.ts` but built incrementally while typing
 * rather than on a complete number.
 */
export function formatPhoneInput(raw: string): string {
  const canonical = toCanonicalPhone(raw);
  if (!canonical) return "";
  return `+994 ${formatNationalPart(raw)}`.trimEnd();
}

/**
 * Same `XX XXX XX XX` mask, but WITHOUT the `+994` prefix — used by the
 * Step 1 phone field, which renders `+994` as its own fixed, non-editable
 * block and only lets the user type/see the 9 national digits.
 */
export function formatNationalPart(raw: string): string {
  const canonical = toCanonicalPhone(raw);
  if (!canonical) return "";
  const national = canonical.slice(4); // digits after +994
  const parts = [
    national.slice(0, 2),
    national.slice(2, 5),
    national.slice(5, 7),
    national.slice(7, 9),
  ].filter(Boolean);
  return parts.join(" ");
}
