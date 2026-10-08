"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportApplications, type ApplicationListParams } from "@/lib/api/admin/applications";

export function ExportApplicationsButton({ filters }: { filters: ApplicationListParams }) {
  const t = useTranslations("admin.applications.export");
  const [loading, setLoading] = useState(false);

  async function handleExport(format: "csv" | "xlsx") {
    setLoading(true);
    try {
      const blob = await exportApplications({ ...filters, format });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `futbolio-applications.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={loading}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {t("label")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => handleExport("csv")}>{t("csv")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleExport("xlsx")}>{t("xlsx")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
