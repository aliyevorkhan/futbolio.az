import type { Metadata } from "next";

/**
 * Minimal shell for the whole /admin area — just noindex metadata for
 * now. No auth guard here yet; the admin-panel agent should add the
 * session check (likely in `middleware.ts`, see the TODO left there,
 * and/or a client-side check calling `getMe()` from `lib/api/auth.ts`)
 * plus real admin chrome (sidebar/nav) around `children`.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-surface">{children}</div>;
}
