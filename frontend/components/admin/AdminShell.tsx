"use client";

import { useTranslations } from "next-intl";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { AdminUser } from "@/lib/api/auth";

/**
 * Chrome wrapping every authenticated `/admin/*` page: a fixed left
 * sidebar on md+ screens, a horizontal top nav bar on mobile — both fed
 * by the same `AdminSidebar` nav-items list so there is exactly one
 * place that defines what's in the nav.
 */
export function AdminShell({
  user,
  onLogout,
  children,
}: {
  user: AdminUser;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin.nav");

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-brand-dark/10 bg-white px-4 py-6 md:flex">
        <div className="mb-6 px-3 text-lg font-bold text-foreground">{t("brand")}</div>
        <AdminSidebar user={user} onLogout={onLogout} orientation="vertical" />
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-brand-dark/10 bg-white px-4 py-3 md:hidden">
          <span className="text-base font-bold text-foreground">{t("brand")}</span>
        </header>
        <div className="border-b border-brand-dark/10 bg-white px-4 py-2 md:hidden">
          <AdminSidebar user={user} onLogout={onLogout} orientation="horizontal" />
        </div>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
