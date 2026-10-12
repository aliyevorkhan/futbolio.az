"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCsrfCookie, login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function AdminLoginPage() {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCsrfCookie().catch(() => {
      // non-fatal — the login POST will just fail its CSRF check and
      // surface as a normal ApiError below
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      queryClient.setQueryData(["admin-me"], user);
      router.push("/admin/applications");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail ?? t("submit") : t("submit"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-brand-dark/10 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {t("emailLabel")}
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {t("passwordLabel")}
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? t("submitting") : t("submit")}
          </Button>

          <Link
            href="/admin/reset-password"
            className="text-center text-sm text-muted underline-offset-2 hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </form>
      </div>
    </div>
  );
}
