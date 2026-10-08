"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchCsrfCookie,
  login,
  enrollTotp,
  confirmTotp,
  verifyTotp,
  type AdminUser,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

type Step =
  | { kind: "credentials" }
  | { kind: "enroll"; loginToken: string; secret: string; provisioningUri: string }
  | { kind: "verify"; loginToken: string };

export default function AdminLoginPage() {
  const t = useTranslations("admin.login");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>({ kind: "credentials" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCsrfCookie().catch(() => {
      // non-fatal — the login POST will just fail its CSRF check and
      // surface as a normal ApiError below
    });
  }, []);

  function onSessionEstablished(user: AdminUser) {
    queryClient.setQueryData(["admin-me"], user);
    router.push("/admin/applications");
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.totp_enrollment_required) {
        const enrollment = await enrollTotp(res.login_token);
        setStep({
          kind: "enroll",
          loginToken: res.login_token,
          secret: enrollment.secret,
          provisioningUri: enrollment.provisioning_uri,
        });
      } else {
        setStep({ kind: "verify", loginToken: res.login_token });
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail ?? t("submit") : t("submit"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnrollSubmit(e: React.FormEvent, loginToken: string) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const user = await confirmTotp(loginToken, code);
      onSessionEstablished(user);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail ?? t("verify") : t("verify"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifySubmit(e: React.FormEvent, loginToken: string) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const user = await verifyTotp(loginToken, code);
      onSessionEstablished(user);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail ?? t("verify") : t("verify"));
    } finally {
      setSubmitting(false);
    }
  }

  async function copySecret(secret: string) {
    try {
      await navigator.clipboard.writeText(secret);
      toast.success(t("secretLabel"));
    } catch {
      // clipboard API unavailable — the secret is still visible/selectable as text
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-brand-dark/10 bg-white p-8 shadow-sm">
        {step.kind === "credentials" && (
          <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
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
        )}

        {step.kind === "enroll" && (
          <form
            onSubmit={(e) => handleEnrollSubmit(e, step.loginToken)}
            className="flex flex-col gap-4"
          >
            <div>
              <h1 className="text-xl font-bold text-foreground">{t("totpEnrollTitle")}</h1>
              <p className="mt-1 text-sm text-muted">{t("totpEnrollInstructions")}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">{t("secretLabel")}</span>
              <div className="flex items-center gap-2 rounded-lg border border-brand-dark/20 bg-surface px-3 py-2">
                <code className="flex-1 select-all break-all text-sm">{step.secret}</code>
                <button
                  type="button"
                  onClick={() => copySecret(step.secret)}
                  className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-brand-dark underline-offset-2 hover:underline"
                >
                  {tc("copy")}
                </button>
              </div>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {t("codeLabel")}
              <Input
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                placeholder={t("codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </label>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <Button type="submit" disabled={submitting || code.length !== 6}>
              {submitting ? t("verifying") : t("verify")}
            </Button>
          </form>
        )}

        {step.kind === "verify" && (
          <form
            onSubmit={(e) => handleVerifySubmit(e, step.loginToken)}
            className="flex flex-col gap-4"
          >
            <div>
              <h1 className="text-xl font-bold text-foreground">{t("totpVerifyTitle")}</h1>
              <p className="mt-1 text-sm text-muted">{t("totpVerifyInstructions")}</p>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {t("codeLabel")}
              <Input
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                placeholder={t("codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </label>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <Button type="submit" disabled={submitting || code.length !== 6}>
              {submitting ? t("verifying") : t("verify")}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep({ kind: "credentials" });
                setCode("");
                setFormError(null);
              }}
              className="text-center text-sm text-muted underline-offset-2 hover:underline"
            >
              {t("backToLogin")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
