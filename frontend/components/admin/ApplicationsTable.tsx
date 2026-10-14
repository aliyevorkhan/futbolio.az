"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPhone } from "@/lib/utils";
import { formatHeadlinePosition } from "@/lib/admin/labels";
import { ageFromDateOfBirth } from "@/lib/admin/age";
import type { ApplicationListItem } from "@/lib/api/admin/applications";

export function ApplicationsTable({ applications }: { applications: ApplicationListItem[] }) {
  const t = useTranslations("admin.applications.table");
  const tEnums = useTranslations("admin.enums");
  const tc = useTranslations("admin.common");
  const router = useRouter();

  function goToDetail(id: string) {
    router.push(`/admin/applications/${id}`);
  }

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-brand-dark/10 bg-white md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">{t("photo")}</TableHead>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("role")}</TableHead>
            <TableHead>{t("position")}</TableHead>
            <TableHead>{t("level")}</TableHead>
            <TableHead>{t("age")}</TableHead>
            <TableHead>{t("district")}</TableHead>
            <TableHead>{t("phone")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("date")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow
              key={app.id}
              tabIndex={0}
              onClick={() => goToDetail(app.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goToDetail(app.id);
              }}
              className="cursor-pointer focus-visible:bg-surface"
            >
              <TableCell>
                <Link
                  href={`/admin/applications/${app.id}`}
                  className="block"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ApplicantAvatar src={app.photo_thumbnail_url} name={app.full_name} />
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/applications/${app.id}`}
                  className="font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {app.full_name}
                </Link>
                {app.is_duplicate && (
                  <Badge variant="amber" className="ml-2">
                    {t("duplicate")}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{tEnums(`role.${app.role}`)}</TableCell>
              <TableCell>
                {app.position ? formatHeadlinePosition(app.role, app.position, tEnums) : tc("noValue")}
              </TableCell>
              <TableCell>
                {app.level ? tEnums(`experienceLevel.${app.level}`) : tc("noValue")}
              </TableCell>
              <TableCell>{ageFromDateOfBirth(app.date_of_birth)}</TableCell>
              <TableCell>{tEnums(`district.${app.district}`)}</TableCell>
              <TableCell>{formatPhone(app.phone)}</TableCell>
              <TableCell>
                <StatusBadge status={app.status} />
              </TableCell>
              <TableCell>{format(new Date(app.created_at), "dd.MM.yyyy HH:mm")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ApplicantAvatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed URL, not an optimizable local asset
      <img
        src={src}
        alt={name}
        className="h-9 w-9 rounded-full border border-brand-dark/10 object-cover"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted">
      <User className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}
