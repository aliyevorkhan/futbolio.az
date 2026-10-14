import { adminApiFetch } from "@/lib/api/client";

/**
 * STUB wrappers for the admin auth endpoints. The admin-panel agent
 * owns the actual login/TOTP enrollment UI and session handling flow;
 * these just wire up the fetch calls per the API contract so that
 * work has a starting point.
 */

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "super_admin";
  can_view_sensitive_files: boolean;
  is_active: boolean;
  must_change_password: boolean;
  last_login: string | null;
  created_at: string;
}

/** Call once before any admin mutation to receive the `csrftoken` cookie. */
export async function fetchCsrfCookie(): Promise<void> {
  await adminApiFetch("/api/admin/auth/csrf/");
}

/**
 * 2FA is disabled — a correct password alone now establishes the
 * session, so this returns the final `AdminUser` directly (the backend's
 * totp enroll/confirm/verify endpoints still exist but are unreachable
 * from this flow).
 */
export async function login(
  email: string,
  password: string,
): Promise<AdminUser> {
  // Was calling the plain apiFetch() directly, which never attaches the
  // X-CSRFToken header (only adminApiFetch does) — every login attempt
  // was unconditionally rejected with a CSRF 403 regardless of
  // credentials, pre-existing and unrelated to this change, found while
  // live-verifying the admin panel.
  return adminApiFetch<AdminUser>("/api/admin/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await adminApiFetch("/api/admin/auth/logout/", { method: "POST" });
}

export async function getMe(): Promise<AdminUser> {
  return adminApiFetch<AdminUser>("/api/admin/auth/me/");
}

export async function requestPasswordReset(email: string): Promise<void> {
  await adminApiFetch("/api/admin/auth/password-reset/request/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<void> {
  await adminApiFetch("/api/admin/auth/password-reset/confirm/", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}
