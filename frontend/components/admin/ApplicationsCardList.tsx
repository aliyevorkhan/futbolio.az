"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPhone } from "@/lib/utils";
import { positionEnumCategory } from "@/lib/admin/labels";
import type { ApplicationListItem } from "@/lib/api/admin/applications";

export function ApplicationsCardList({ applications }: { applications: ApplicationListItem[] }) {
  const t = useTranslations("admin.applications.table");
  const tEnums = useTranslations("admin.enums");
  const tc = useTranslations("admin.common");

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {applications.map((app) => (
        <Link
          key={app.id}
          href={`/admin/applications/${app.id}`}
          className="flex flex-col gap-2 rounded-xl border border-brand-dark/10 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-foreground">
                {app.full_name}
                {app.is_duplicate && (
                  <Badge variant="amber" className="ml-2">
                    {t("duplicate")}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted">{tEnums(`role.${app.role}`)}</div>
            </div>
            <StatusBadge status={app.status} />
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <Row label={t("position")}>
              {app.position ? tEnums(`${positionEnumCategory(app.role)}.${app.position}`) : tc("noValue")}
            </Row>
            <Row label={t("age")}>{app.age}</Row>
            <Row label={t("district")}>{tEnums(`district.${app.district}`)}</Row>
            <Row label={t("phone")}>{formatPhone(app.phone)}</Row>
            <Row label={t("date")}>{format(new Date(app.created_at), "dd.MM.yyyy HH:mm")}</Row>
          </dl>
        </Link>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-muted-2">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
