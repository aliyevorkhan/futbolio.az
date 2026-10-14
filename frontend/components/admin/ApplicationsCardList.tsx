"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ApplicantAvatar } from "@/components/admin/ApplicationsTable";
import { ApplicationRowActions } from "@/components/admin/ApplicationRowActions";
import { formatPhone } from "@/lib/utils";
import { formatHeadlinePosition } from "@/lib/admin/labels";
import { ageFromDateOfBirth } from "@/lib/admin/age";
import type { ApplicationListItem, ApplicationTab } from "@/lib/api/admin/applications";

export function ApplicationsCardList({
  applications,
  tab,
  selectedIds,
  onToggleSelect,
}: {
  applications: ApplicationListItem[];
  tab: ApplicationTab;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  const t = useTranslations("admin.applications.table");
  const tApplications = useTranslations("admin.applications");
  const tEnums = useTranslations("admin.enums");
  const tc = useTranslations("admin.common");

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {applications.map((app) => (
        <div key={app.id} className="flex flex-col gap-2 rounded-xl border border-brand-dark/10 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.has(app.id)}
                onCheckedChange={() => onToggleSelect(app.id)}
                aria-label={tApplications("selectRow", { name: app.full_name })}
              />
              <Link href={`/admin/applications/${app.id}`} className="flex items-center gap-3">
                <ApplicantAvatar src={app.photo_thumbnail_url} name={app.full_name} />
                <div>
                  <div className="font-semibold text-foreground">
                    {app.full_name}
                    {app.is_duplicate && (
                      <Badge variant="amber" className="ml-2">
                        {t("duplicate")}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted">
                    {tEnums(`role.${app.role}`)} · <span className="font-mono">{app.display_id}</span>
                  </div>
                </div>
              </Link>
            </div>
            <StatusBadge status={app.status} />
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <Row label={t("position")}>
              {app.position ? formatHeadlinePosition(app.role, app.position, tEnums) : tc("noValue")}
            </Row>
            {app.role === "player" && (
              <Row label={t("level")}>
                {app.level ? tEnums(`experienceLevel.${app.level}`) : tc("noValue")}
              </Row>
            )}
            <Row label={t("age")}>{ageFromDateOfBirth(app.date_of_birth)}</Row>
            <Row label={t("district")}>{tEnums(`district.${app.district}`)}</Row>
            <Row label={t("phone")}>{formatPhone(app.phone)}</Row>
            <Row label={t("date")}>{format(new Date(app.created_at), "dd.MM.yyyy HH:mm")}</Row>
          </dl>

          <div className="flex justify-end border-t border-brand-dark/5 pt-2">
            <ApplicationRowActions applicationId={app.id} applicationName={app.full_name} tab={tab} />
          </div>
        </div>
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
