import type { ApplicationRole } from "@/lib/api/admin/applications";

/**
 * Which `admin.enums.*` category the list/detail "headline position" code
 * belongs to depends on the application's role — player -> main_position,
 * referee -> license_status, medic -> specialty.
 */
export function positionEnumCategory(
  role: ApplicationRole,
): "mainPosition" | "licenseStatus" | "specialty" {
  if (role === "referee") return "licenseStatus";
  if (role === "medic") return "specialty";
  return "mainPosition";
}
