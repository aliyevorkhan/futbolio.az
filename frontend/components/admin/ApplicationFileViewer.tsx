"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Eye } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import {
  getApplicationFileUrl,
  type FileDetailSummary,
  type FileUrlResponse,
} from "@/lib/api/admin/applications";

const SCAN_VARIANT: Record<FileDetailSummary["scan_status"], BadgeProps["variant"]> = {
  clean: "green",
  pending: "gray",
  infected: "red",
  error: "amber",
};

export function ApplicationFileViewer({
  applicationId,
  file,
}: {
  applicationId: string;
  file: FileDetailSummary;
}) {
  const t = useTranslations("admin.applicationDetail.files");
  const tEnums = useTranslations("admin.enums");
  const [resolved, setResolved] = useState<FileUrlResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleView() {
    setError(null);
    setLoading(true);
    try {
      const res = await getApplicationFileUrl(applicationId, file.id);
      setResolved(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError(t("forbidden"));
      } else {
        setError(t("loadError"));
      }
    } finally {
      setLoading(false);
    }
  }

  const scanLabel =
    file.scan_status === "clean"
      ? t("scanClean")
      : file.scan_status === "pending"
        ? t("scanPending")
        : file.scan_status === "infected"
          ? t("scanInfected")
          : t("scanError");

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-brand-dark/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{file.original_name}</span>
          <span className="text-muted">({tEnums(`fileKind.${file.kind}`)})</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={SCAN_VARIANT[file.scan_status]}>{scanLabel}</Badge>
          {file.scan_status === "clean" && !resolved && (
            <Button type="button" size="sm" variant="outline" onClick={handleView} disabled={loading}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              {loading ? t("loadingUrl") : t("view")}
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {resolved && (
        <div className="flex flex-col gap-2">
          {resolved.kind === "photo" && (
            // eslint-disable-next-line @next/next/no-img-element -- signed URL, not an optimizable local asset
            <img
              src={resolved.url}
              alt={file.original_name}
              className="max-h-80 w-auto rounded-lg border border-brand-dark/10 object-contain"
            />
          )}
          {resolved.kind === "video" && (
            <video src={resolved.url} controls className="max-h-80 w-full rounded-lg" />
          )}
          <a
            href={resolved.url}
            className="text-sm font-medium text-brand-dark underline-offset-2 hover:underline"
          >
            {t("download")}
          </a>
        </div>
      )}
    </div>
  );
}
