"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth/useSession";
import { logout } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { AdminShell } from "@/components/admin/AdminShell";

/**
 * Guards every real admin page (applications/settings/admin-users) behind
 * a valid session. Lives in a route group so `/admin/login` and
 * `/admin/reset-password` — siblings under `app/(admin)/admin/` — never
 * pass through this check and can't get stuck in a redirect loop.
 */
export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("admin.guard");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isError, error, isLoading } = useSession();

  useEffect(() => {
    if (isError && error instanceof ApiError && error.status === 401) {
      router.replace("/admin/login");
    }
  }, [isError, error, router]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      queryClient.clear();
      router.replace("/admin/login");
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        {t("checkingSession")}
      </div>
    );
  }

  return (
    <AdminShell user={user} onLogout={handleLogout}>
      {children}
    </AdminShell>
  );
}
