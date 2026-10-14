import type { ApplicationRole } from "@/lib/api/admin/applications";

/**
 * The list/detail "headline position" string's shape depends on role (see
 * `headline_position()` in `applications/serializers.py`):
 * - player: a single `mainPosition` code
 * - referee: a single `duration` code (years_refereeing bucket)
 * - medic: zero or more comma-joined `specialty` codes
 *
 * `tEnums` is `useTranslations("admin.enums")` from the caller.
 */
export function formatHeadlinePosition(
  role: ApplicationRole,
  position: string,
  tEnums: (key: string) => string,
): string {
  if (!position) return "";
  if (role === "referee") return tEnums(`duration.${position}`);
  if (role === "medic") {
    return position
      .split(",")
      .filter(Boolean)
      .map((code) => tEnums(`specialty.${code}`))
      .join(", ");
  }
  return tEnums(`mainPosition.${position}`);
}

/** Splits a backend "weekday:hour_slot" composite string into its parts. */
export function parseTimeSlot(value: string): { day: string; slot: string } | null {
  const [day, slot] = value.split(":");
  if (!day || !slot) return null;
  return { day, slot };
}
