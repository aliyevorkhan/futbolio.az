export type UploadKind = "photo" | "video" | "document";

export interface FileKindRule {
  /** Accepted MIME types for this kind. */
  accept: string[];
  maxBytes: number;
}

/**
 * Client-side mirror of the backend's per-kind file validation. Enforced
 * at file-pick time (before ever calling presign) in addition to
 * whatever the server re-checks.
 */
export const FILE_RULES: Record<UploadKind, FileKindRule> = {
  photo: {
    accept: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
    maxBytes: 10 * 1024 * 1024,
  },
  video: {
    accept: ["video/mp4", "video/quicktime"],
    maxBytes: 200 * 1024 * 1024,
  },
  document: {
    accept: ["application/pdf", "image/jpeg", "image/png"],
    maxBytes: 10 * 1024 * 1024,
  },
};

/** Files at or below this size use a single presigned PUT; above it, multipart. */
export const MULTIPART_THRESHOLD_BYTES = 20 * 1024 * 1024;

export function isFileKindValid(file: File, kind: UploadKind): "ok" | "invalidFileType" | "fileTooLarge" {
  const rule = FILE_RULES[kind];
  if (!rule.accept.includes(file.type)) return "invalidFileType";
  if (file.size > rule.maxBytes) return "fileTooLarge";
  return "ok";
}
