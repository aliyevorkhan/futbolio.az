import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from "@/i18n/request";

/**
 * Sets the NEXT_LOCALE cookie on first visit so next-intl's cookie-based
 * (not path-prefixed) locale resolution in i18n/request.ts has something
 * to read. Only one locale (az) exists today, so this is mostly
 * scaffolding for when a second locale is added.
 *
 * Admin-auth guard: redirect unauthenticated requests to `/admin/*`
 * (other than `/admin/login` and `/admin/reset-password`) to the login
 * page by checking for Django's default session cookie (`sessionid`).
 * This is a cheap UX fast-path only (avoids a flash of admin chrome) —
 * the real enforcement is every API call's 401 from the backend, since
 * cookie *presence* says nothing about whether the session is still
 * valid server-side.
 */
const SESSION_COOKIE_NAME = "sessionid";
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isAdminPath && !isPublicAdminPath && !request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const response = NextResponse.next();

  if (!request.cookies.has(LOCALE_COOKIE_NAME)) {
    response.cookies.set(LOCALE_COOKIE_NAME, DEFAULT_LOCALE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
