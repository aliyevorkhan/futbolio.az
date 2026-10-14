"use client";

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Download, Maximize2 } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/client";
import {
  getApplicationFileUrl,
  type FileDetailSummary,
  type FileUrlResponse,
} from "@/lib/api/admin/applications";
import { VideoPlayer } from "@/components/admin/VideoPlayer";
import { PhotoLightbox } from "@/components/admin/PhotoLightbox";

const SCAN_VARIANT: Record<FileDetailSummary["scan_status"], BadgeProps["variant"]> = {
  clean: "green",
  pending: "gray",
  infected: "red",
  error: "amber",
};

function isPdf(file: FileDetailSummary): boolean {
  return file.original_name.toLowerCase().endsWith(".pdf");
}

/**
 * Resolves every clean file's signed view/download URL up front, grouped
 * into photo gallery / video players / document previews, so nothing
 * hides behind an extra click. A file that isn't clean yet, or whose
 * signed URL fails to load, shows an explicit status instead of leaving
 * a blank gap.
 */
export function MediaSection({
  applicationId,
  files,
}: {
  applicationId: string;
  files: FileDetailSummary[];
}) {
  const t = useTranslations("admin.applicationDetail.files");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const resolved = useQueries({
    queries: files.map((file) => ({
      queryKey: ["admin-application-file-url", applicationId, file.id],
      queryFn: () => getApplicationFileUrl(applicationId, file.id),
      enabled: file.scan_status === "clean",
      staleTime: 10 * 60 * 1000,
      retry: false,
    })),
  });

  if (files.length === 0) {
    return <p className="text-sm text-muted">{t("noFiles")}</p>;
  }

  const photos = files
    .map((file, index) => ({ file, result: resolved[index] }))
    .filter(({ file }) => file.kind === "photo");
  const videos = files
    .map((file, index) => ({ file, result: resolved[index] }))
    .filter(({ file }) => file.kind === "video");
  const documents = files
    .map((file, index) => ({ file, result: resolved[index] }))
    .filter(({ file }) => file.kind === "document");

  const lightboxPhotos = photos
    .filter(({ result }) => result.data)
    .map(({ file, result }) => ({
      id: file.id,
      url: (result.data as FileUrlResponse).url,
      name: file.original_name,
    }));

  return (
    <div className="flex flex-col gap-6">
      {photos.length > 0 && (
        <MediaGroup title={t("photoTab")}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map(({ file, result }) => (
              <FileStatusWrapper key={file.id} file={file} result={result} t={t} square>
                {result.data && (
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex(lightboxPhotos.findIndex((p) => p.id === file.id))
                    }
                    className="group relative block aspect-square w-full overflow-hidden rounded-lg border border-brand-dark/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, not an optimizable local asset */}
                    <img
                      src={(result.data as FileUrlResponse).url}
                      alt={file.original_name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-brand-dark/0 opacity-0 transition-all group-hover:bg-brand-dark/30 group-hover:opacity-100">
                      <Maximize2 className="h-5 w-5 text-white" aria-hidden="true" />
                    </span>
                  </button>
                )}
              </FileStatusWrapper>
            ))}
          </div>
          <PhotoLightbox
            photos={lightboxPhotos}
            openIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        </MediaGroup>
      )}

      {videos.length > 0 && (
        <MediaGroup title={t("videoTab")}>
          <div className="flex flex-col gap-4">
            {videos.map(({ file, result }) => (
              <FileStatusWrapper key={file.id} file={file} result={result} t={t}>
                {result.data && <VideoPlayer src={(result.data as FileUrlResponse).url} />}
              </FileStatusWrapper>
            ))}
          </div>
        </MediaGroup>
      )}

      {documents.length > 0 && (
        <MediaGroup title={t("documentTab")}>
          <div className="flex flex-col gap-4">
            {documents.map(({ file, result }) => (
              <FileStatusWrapper key={file.id} file={file} result={result} t={t}>
                {result.data && (
                  <DocumentPreview
                    file={file}
                    data={result.data as FileUrlResponse}
                    label={t("download")}
                    hint={t("pdfPreviewHint")}
                  />
                )}
              </FileStatusWrapper>
            ))}
          </div>
        </MediaGroup>
      )}
    </div>
  );
}

function MediaGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-2">{title}</h3>
      {children}
    </div>
  );
}

function DocumentPreview({
  file,
  data,
  label,
  hint,
}: {
  file: FileDetailSummary;
  data: FileUrlResponse;
  label: string;
  hint: string;
}) {
  const pdf = isPdf(file);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-brand-dark/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{file.original_name}</span>
        <a
          href={data.download_url}
          className="flex items-center gap-1.5 rounded-full bg-brand-dark px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark/90"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </a>
      </div>
      {pdf ? (
        <>
          <p className="text-xs text-muted">{hint}</p>
          <object data={data.url} type="application/pdf" className="h-[480px] w-full rounded-lg border border-brand-dark/10">
            <a href={data.download_url} className="text-sm text-brand-dark underline">
              {file.original_name}
            </a>
          </object>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- signed URL, not an optimizable local asset
        <img
          src={data.url}
          alt={file.original_name}
          className="max-h-96 w-auto rounded-lg border border-brand-dark/10 object-contain"
        />
      )}
    </div>
  );
}

function FileStatusWrapper({
  file,
  result,
  t,
  square,
  children,
}: {
  file: FileDetailSummary;
  result: { data?: FileUrlResponse; isLoading: boolean; isError: boolean; error: unknown };
  t: (key: string) => string;
  square?: boolean;
  children: React.ReactNode;
}) {
  if (file.scan_status !== "clean") {
    return (
      <StatusBox square={square}>
        <Badge variant={SCAN_VARIANT[file.scan_status]}>
          {file.scan_status === "pending"
            ? t("scanPending")
            : file.scan_status === "infected"
              ? t("scanInfected")
              : t("scanError")}
        </Badge>
        <span className="text-xs text-muted">{file.original_name}</span>
      </StatusBox>
    );
  }

  if (result.isLoading) {
    return (
      <StatusBox square={square}>
        <span className="text-xs text-muted">{t("loadingUrl")}</span>
      </StatusBox>
    );
  }

  if (result.isError) {
    const forbidden = result.error instanceof ApiError && result.error.status === 403;
    return (
      <StatusBox square={square}>
        <span className="text-xs text-red-600">{forbidden ? t("sensitiveForbidden") : t("notFound")}</span>
      </StatusBox>
    );
  }

  if (file.is_sensitive) {
    return (
      <div className="flex flex-col gap-1.5">
        <Badge variant="amber" className="w-fit">
          {t("sensitiveBadge")}
        </Badge>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

function StatusBox({ square, children }: { square?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={
        square
          ? "flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-dark/15 bg-surface p-2 text-center"
          : "flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-dark/15 bg-surface p-6 text-center"
      }
    >
      {children}
    </div>
  );
}
