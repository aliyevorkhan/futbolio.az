"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EditPhoneDialog } from "@/components/admin/EditPhoneDialog";
import { listDuplicatePhoneGroups } from "@/lib/api/admin/applications";

/**
 * Permanent read-only report (never deletes/merges anything) — a real
 * duplicate is resolved by editing one of the conflicting records'
 * phone number via EditPhoneDialog, same component the candidate
 * detail page would use.
 */
export default function DuplicatePhonesPage() {
  const t = useTranslations("admin.duplicatePhones");
  const tEnums = useTranslations("admin.enums");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-duplicate-phones"],
    queryFn: listDuplicatePhoneGroups,
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("description")}</p>

      <div className="mt-6 space-y-6">
        {isLoading ? null : data && data.length === 0 ? (
          <p className="text-sm text-muted">{t("empty")}</p>
        ) : (
          data?.map((group) => (
            <div key={group.phone} className="rounded-xl border border-brand-dark/10 bg-white">
              <div className="border-b border-brand-dark/10 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  {t("phoneLabel")}: {group.phone}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs font-semibold uppercase text-muted">
                      <th className="px-4 py-2">{t("columns.id")}</th>
                      <th className="px-4 py-2">{t("columns.name")}</th>
                      <th className="px-4 py-2">{t("columns.role")}</th>
                      <th className="px-4 py-2">{t("columns.status")}</th>
                      <th className="px-4 py-2">{t("columns.date")}</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {group.applications.map((application) => (
                      <tr key={application.id} className="border-t border-brand-dark/5">
                        <td className="px-4 py-2.5 font-mono text-xs text-muted">
                          {application.display_id}
                        </td>
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/admin/applications/${application.id}`}
                            className="font-medium text-foreground underline-offset-2 hover:underline"
                          >
                            {application.full_name}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">{tEnums(`role.${application.role}`)}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={application.status} />
                        </td>
                        <td className="px-4 py-2.5 text-muted">
                          {new Date(application.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <EditPhoneDialog
                            applicationId={application.id}
                            currentPhone={group.phone}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
