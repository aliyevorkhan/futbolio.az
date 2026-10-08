import { adminApiFetch, apiFetch } from "@/lib/api/client";

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

export interface LoginResponse {
  totp_enrollment_required: boolean;
  login_token: string;
}

export interface TotpEnrollResponse {
  secret: string;
  provisioning_uri: string;
}

/** Call once before any admin mutation to receive the `csrftoken` cookie. */
export async function fetchCsrfCookie(): Promise<void> {
  await adminApiFetch("/api/admin/auth/csrf/");
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/admin/auth/login/", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
}

export async function enrollTotp(
  loginToken: string,
): Promise<TotpEnrollResponse> {
  return adminApiFetch<TotpEnrollResponse>("/api/admin/auth/totp/enroll/", {
    method: "POST",
    body: JSON.stringify({ login_token: loginToken }),
  });
}

export async function confirmTotp(
  loginToken: string,
  code: string,
): Promise<AdminUser> {
  return adminApiFetch<AdminUser>("/api/admin/auth/totp/confirm/", {
    method: "POST",
    body: JSON.stringify({ login_token: loginToken, code }),
  });
}

export async function verifyTotp(
  loginToken: string,
  code: string,
): Promise<AdminUser> {
  return adminApiFetch<AdminUser>("/api/admin/auth/totp/verify/", {
    method: "POST",
    body: JSON.stringify({ login_token: loginToken, code }),
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
