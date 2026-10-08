"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutList, Settings, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/lib/api/auth";

interface NavItem {
  href: string;
  labelKey: "applications" | "settings" | "adminUsers";
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/applications", labelKey: "applications", icon: LayoutList },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
  { href: "/admin/admin-users", labelKey: "adminUsers", icon: Users, superAdminOnly: true },
];

export function AdminSidebar({
  user,
  onLogout,
  className,
  orientation = "vertical",
}: {
  user: AdminUser;
  onLogout: () => void;
  className?: string;
  orientation?: "vertical" | "horizontal";
}) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.superAdminOnly || user.role === "super_admin");

  return (
    <nav
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-1"
          : "flex flex-row items-center gap-1 overflow-x-auto",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "bg-brand-green/20 text-brand-dark"
                : "text-muted hover:bg-brand-dark/5 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t(item.labelKey)}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t("logout")}
      </button>
    </nav>
  );
}
