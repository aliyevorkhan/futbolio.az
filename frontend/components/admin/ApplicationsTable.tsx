"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
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
import { positionEnumCategory } from "@/lib/admin/labels";
import type { ApplicationListItem } from "@/lib/api/admin/applications";

export function ApplicationsTable({ applications }: { applications: ApplicationListItem[] }) {
  const t = useTranslations("admin.applications.table");
  const tEnums = useTranslations("admin.enums");

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-brand-dark/10 bg-white md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("role")}</TableHead>
            <TableHead>{t("position")}</TableHead>
            <TableHead>{t("age")}</TableHead>
            <TableHead>{t("district")}</TableHead>
            <TableHead>{t("phone")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("date")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id} className="cursor-pointer">
              <TableCell>
                <Link href={`/admin/applications/${app.id}`} className="font-medium hover:underline">
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
                {app.position ? tEnums(`${positionEnumCategory(app.role)}.${app.position}`) : "—"}
              </TableCell>
              <TableCell>{app.age}</TableCell>
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
