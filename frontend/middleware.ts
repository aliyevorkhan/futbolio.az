import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

/**
 * Two unrelated concerns share this one middleware file, branched BEFORE
 * either runs rather than merged into one pipeline:
 *
 * 1. Admin auth guard — `/admin/*` (except login/reset-password) redirects
 *    to `/admin/login` when Django's session cookie is absent. Cheap
 *    UX fast-path only; real enforcement is every API call's 401, since
 *    cookie *presence* says nothing about server-side session validity.
 *    Admin is NOT locale-prefixed, so these paths never reach next-intl.
 * 2. Everything else (marketing routes) goes through next-intl's own
 *    locale-detection/redirect middleware (az default un-prefixed,
 *    ru/en prefixed — see i18n/routing.ts).
 */
const SESSION_COOKIE_NAME = "sessionid";
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/reset-password"];
const intlMiddleware = createIntlMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminPath) {
    const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    if (!isPublicAdminPath && !request.cookies.has(SESSION_COOKIE_NAME)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
