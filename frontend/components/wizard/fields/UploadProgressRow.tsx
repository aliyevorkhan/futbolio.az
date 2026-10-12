"use client";

import { useEffect, useState } from "react";
import { Loader2, X, RotateCcw, Check, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { FileUploadStatus } from "@/lib/upload/useFileUpload";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadProgressRowProps {
  filename: string;
  size: number;
  progress: number;
  status: FileUploadStatus;
  errorMessage?: string;
  statusLabels: { uploading: string; uploaded: string; error: string };
  onRemove: () => void;
  onRetry: () => void;
  removeLabel: string;
  retryLabel: string;
  /** The picked image file, used to render a local thumbnail preview (photo slots only). */
  previewFile?: File | null;
}

/** One row: filename/size, progress bar, status text, retry/remove. */
export function UploadProgressRow({
  filename,
  size,
  progress,
  status,
  errorMessage,
  statusLabels,
  onRemove,
  onRetry,
  removeLabel,
  retryLabel,
  previewFile,
}: UploadProgressRowProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewFile || !previewFile.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-dark/15 bg-white p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-dark/5">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : status === "uploaded" ? (
          <Check className="h-5 w-5 text-brand-green" aria-hidden="true" />
        ) : status === "error" ? (
          <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-muted" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{filename}</p>
        <p className="text-xs text-muted">{formatBytes(size)}</p>
        {status === "uploading" || status === "validating" ? (
          <div className="mt-1.5 flex items-center gap-2">
            <Progress value={progress} className="h-1.5" />
            <span className="w-9 shrink-0 text-right text-xs text-muted">{progress}%</span>
          </div>
        ) : null}
        <p
          className={
            status === "error"
              ? "mt-1 text-xs text-red-600"
              : status === "uploaded"
                ? "mt-1 text-xs text-brand-green"
                : "mt-1 text-xs text-muted"
          }
        >
          {status === "error"
            ? errorMessage ?? statusLabels.error
            : status === "uploaded"
              ? statusLabels.uploaded
              : statusLabels.uploading}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {status === "error" ? (
          <button
            type="button"
            onClick={onRetry}
            aria-label={retryLabel}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-brand-dark/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-brand-dark/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
