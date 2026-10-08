import { adminApiFetch } from "@/lib/api/client";
import type { AdminUser } from "@/lib/api/auth";
import type { PaginatedResponse } from "@/lib/api/admin/applications";

/**
 * Admin-user management (super_admin only — backend enforces 403 for a
 * plain admin via `IsSuperAdmin`; the UI additionally hides this nav
 * item/page client-side, see `AdminSidebar.tsx` / `admin-users/page.tsx`).
 */

export interface AdminUserCreatePayload {
  email: string;
  full_name: string;
  role: "admin" | "super_admin";
  can_view_sensitive_files: boolean;
}

export async function listAdminUsers(): Promise<PaginatedResponse<AdminUser>> {
  return adminApiFetch("/api/admin/admin-users/");
}

export async function createAdminUser(
  payload: AdminUserCreatePayload,
): Promise<AdminUser> {
  return adminApiFetch<AdminUser>("/api/admin/admin-users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function disableAdminUser(id: string): Promise<AdminUser> {
  return adminApiFetch<AdminUser>(`/api/admin/admin-users/${id}/disable/`, {
    method: "PATCH",
  });
}

export async function resetAdminUserPassword(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/admin-users/${id}/reset-password/`, {
    method: "POST",
  });
}
