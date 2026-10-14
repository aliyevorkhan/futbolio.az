"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_EXPORT_COLUMN_KEYS, EXPORT_COLUMN_GROUPS } from "@/lib/admin/exportColumns";
import { exportApplications, type ApplicationListParams } from "@/lib/api/admin/applications";

/**
 * "Açıq tab və filtrlərə uyğun işləyir: ekranda nə görünürsə, o
 * yüklənsin" — `filters` is exactly what the page currently has applied
 * (tab + every active filter), passed straight through unchanged.
 */
export function ExportApplicationsButton({ filters }: { filters: ApplicationListParams }) {
  const t = useTranslations("admin.applications.export");
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"csv" | "xlsx">("xlsx");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(ALL_EXPORT_COLUMN_KEYS));

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleExport() {
    setLoading(true);
    try {
      const blob = await exportApplications({
        ...filters,
        format,
        columns: [...selected],
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.download = `futbolio_namizedler_${today}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4" aria-hidden="true" />
        {t("label")}
      </Button>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("columnsTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <Select value={format} onValueChange={(v) => setFormat(v as "csv" | "xlsx")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xlsx">{t("xlsx")}</SelectItem>
              <SelectItem value="csv">{t("csv")}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              className="font-medium text-brand-dark underline-offset-2 hover:underline"
              onClick={() => setSelected(new Set(ALL_EXPORT_COLUMN_KEYS))}
            >
              {t("selectAll")}
            </button>
            <button
              type="button"
              className="font-medium text-muted underline-offset-2 hover:underline"
              onClick={() => setSelected(new Set())}
            >
              {t("selectNone")}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {EXPORT_COLUMN_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {group.title}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.columns.map((column) => (
                  <label key={column.key} className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={selected.has(column.key)}
                      onCheckedChange={() => toggle(column.key)}
                    />
                    {column.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleExport} disabled={loading || selected.size === 0}>
            {loading ? t("exporting") : t("label")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
