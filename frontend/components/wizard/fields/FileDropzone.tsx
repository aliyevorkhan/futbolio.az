"use client";

import * as React from "react";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadProgressRow } from "./UploadProgressRow";
import type { FileUploadState } from "@/lib/upload/useFileUpload";

interface FileDropzoneProps {
  label: string;
  hint?: string;
  accept: string[];
  state: FileUploadState;
  onSelect: (file: File) => void;
  onRemove: () => void;
  onRetry: () => void;
  browseLabel: string;
  dragLabel: string;
  errorLabels: Record<string, string>;
  statusLabels: { uploading: string; uploaded: string; error: string };
  removeLabel: string;
  retryLabel: string;
  registerRef?: (el: HTMLElement | null) => void;
  error?: string;
}

/**
 * Drag-and-drop + click-to-pick single-file slot. Renders its own
 * `UploadProgressRow` once a file has been picked, so callers (Step 4)
 * just render one `FileDropzone` per slot and don't juggle progress UI
 * themselves.
 */
export function FileDropzone({
  label,
  hint,
  accept,
  state,
  onSelect,
  onRemove,
  onRetry,
  browseLabel,
  dragLabel,
  errorLabels,
  statusLabels,
  removeLabel,
  retryLabel,
  registerRef,
  error,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onSelect(file);
  };

  if (state.status !== "idle") {
    return (
      <div ref={registerRef as React.Ref<HTMLDivElement>} tabIndex={-1}>
        <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
        <UploadProgressRow
          filename={state.file?.name ?? ""}
          size={state.file?.size ?? 0}
          progress={state.progress}
          status={state.status}
          errorMessage={state.error ? errorLabels[state.error] ?? state.error : undefined}
          statusLabels={statusLabels}
          onRemove={onRemove}
          onRetry={onRetry}
          removeLabel={removeLabel}
          retryLabel={retryLabel}
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      <button
        type="button"
        ref={registerRef as React.Ref<HTMLButtonElement>}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-dark/20 bg-white px-4 py-6 text-center transition-colors hover:bg-brand-dark/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2",
          error && "border-red-500",
          isDragging && "border-brand-green bg-brand-green/10",
        )}
      >
        <Upload className="h-5 w-5 text-muted" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">{dragLabel}</span>
        <span className="text-xs text-brand-green underline">{browseLabel}</span>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
        tabIndex={-1}
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
