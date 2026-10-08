/**
 * Shared fetch wrapper for every API call in the app (public and admin).
 *
 * - Public endpoints: plain fetch, no credentials needed.
 * - Admin endpoints: pass `credentials: "include"` via `options` (every
 *   admin wrapper in `lib/api/admin/*` and `lib/api/auth.ts` already
 *   does this) so the session cookie set by Django is sent, and pass
 *   an `X-CSRFToken` header on state-changing requests — see
 *   `getCsrfTokenFromCookie()` below.
 *
 * All API wrapper functions in this codebase should go through
 * `apiFetch<T>()` rather than calling `fetch` directly, so error
 * handling and base-URL resolution stay in one place.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  status: number;
  detail: string | null;
  fieldErrors: Record<string, string[]>;

  constructor(
    status: number,
    detail: string | null,
    fieldErrors: Record<string, string[]>,
  ) {
    super(detail ?? "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Parse a DRF-style error response body into `{ detail, fieldErrors }`.
 * DRF errors come back in one of a few shapes:
 *   - `{ "detail": "generic message" }`
 *   - `{ "field_name": ["message", ...], "non_field_errors": [...] }`
 *   - a bare string, or nothing parseable at all
 */
function parseErrorBody(body: unknown): {
  detail: string | null;
  fieldErrors: Record<string, string[]>;
} {
  if (!body || typeof body !== "object") {
    return { detail: typeof body === "string" ? body : null, fieldErrors: {} };
  }

  const obj = body as Record<string, unknown>;
  const fieldErrors: Record<string, string[]> = {};
  let detail: string | null = null;

  for (const [key, value] of Object.entries(obj)) {
    if (key === "detail" && typeof value === "string") {
      detail = value;
      continue;
    }
    if (Array.isArray(value)) {
      fieldErrors[key] = value.map((v) => String(v));
    } else if (typeof value === "string") {
      fieldErrors[key] = [value];
    }
  }

  return { detail, fieldErrors };
}

export interface ApiFetchOptions extends RequestInit {
  /** Parse the response as JSON (default) or skip parsing (e.g. blob downloads). */
  parseJson?: boolean;
}

/**
 * Fetch a path relative to NEXT_PUBLIC_API_URL and parse the JSON
 * response, throwing `ApiError` on any non-2xx response.
 *
 * @param path - must start with `/`, e.g. `/api/public/settings/`
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { parseJson = true, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body && !(rest.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      Accept: "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // response had no JSON body (e.g. 500 html page) — leave body null
    }
    const { detail, fieldErrors } = parseErrorBody(body);
    throw new ApiError(res.status, detail, fieldErrors);
  }

  if (!parseJson) {
    return res as unknown as T;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/**
 * Read the Django CSRF cookie (`csrftoken` by default) from
 * `document.cookie`. Call `GET /api/admin/auth/csrf/` once per session
 * first to ensure the cookie is set, then pass the value returned here
 * as the `X-CSRFToken` header on every admin POST/PUT/PATCH/DELETE.
 * Client-side only (reads `document.cookie`).
 */
export function getCsrfTokenFromCookie(cookieName = "csrftoken"): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${cookieName}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Convenience wrapper for admin-authenticated calls: includes the
 * session cookie and, for non-GET requests, attaches the CSRF header
 * automatically.
 */
export async function adminApiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const needsCsrf = method !== "GET" && method !== "HEAD";
  const csrfToken = needsCsrf ? getCsrfTokenFromCookie() : null;

  return apiFetch<T>(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      ...options.headers,
    },
  });
}
