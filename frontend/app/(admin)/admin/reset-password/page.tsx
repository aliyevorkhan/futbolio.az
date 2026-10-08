"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, confirmPasswordReset } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

/**
 * Serves two purposes behind one route, distinguished by `?token=`:
 * no token -> request-a-reset-link form; token present -> set-new-password
 * form. Matches the link the backend emails
 * (`FRONTEND_URL + "/admin/reset-password?token=..."`).
 */
export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const token = useSearchParams().get("token");
  return token ? <ConfirmResetForm token={token} /> : <RequestResetForm />;
}

function RequestResetForm() {
  const t = useTranslations("admin.resetPassword");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  }

  return (
    <Shell>
      {done ? (
        <p className="text-sm text-foreground">{t("requestSuccess")}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("requestTitle")}</h1>
            <p className="mt-1 text-sm text-muted">{t("requestSubtitle")}</p>
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
          <Button type="submit" disabled={submitting}>
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      )}
      <Link
        href="/admin/login"
        className="mt-4 block text-center text-sm text-muted underline-offset-2 hover:underline"
      >
        {t("goToLogin")}
      </Link>
    </Shell>
  );
}

function ConfirmResetForm({ token }: { token: string }) {
  const t = useTranslations("admin.resetPassword");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await confirmPasswordReset(token, newPassword);
      setDone(true);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.detail ?? t("invalidToken") : t("invalidToken"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      {done ? (
        <p className="text-sm text-foreground">{t("confirmSuccess")}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <h1 className="text-xl font-bold text-foreground">{t("confirmTitle")}</h1>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {t("newPasswordLabel")}
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? t("confirmSubmitting") : t("confirmSubmit")}
          </Button>
        </form>
      )}
      <Link
        href="/admin/login"
        className="mt-4 block text-center text-sm text-muted underline-offset-2 hover:underline"
      >
        {t("goToLogin")}
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-brand-dark/10 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
