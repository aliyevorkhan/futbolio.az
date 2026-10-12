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

/** Extension fallback for browsers that report an empty/unreliable `file.type`
 * — most notably iOS Safari for HEIC photos picked from the Photos app,
 * which is the most common real-world cause of "photo upload doesn't
 * work" reports. */
const EXTENSION_FALLBACK: Record<UploadKind, RegExp> = {
  photo: /\.(jpe?g|png|webp|heic|heif)$/i,
  video: /\.(mp4|mov)$/i,
  document: /\.(pdf|jpe?g|png)$/i,
};

export function isFileKindValid(file: File, kind: UploadKind): "ok" | "invalidFileType" | "fileTooLarge" {
  const rule = FILE_RULES[kind];
  const typeOk =
    rule.accept.includes(file.type) || (!file.type && EXTENSION_FALLBACK[kind].test(file.name));
  if (!typeOk) return "invalidFileType";
  if (file.size > rule.maxBytes) return "fileTooLarge";
  return "ok";
}

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  pdf: "application/pdf",
};

/**
 * The declared content type to send to the backend. Some browsers (most
 * notably iOS Safari, for HEIC photos picked from the Photos app) report
 * an empty `file.type` — sending that through unchanged fails the
 * presign request (`content_type` is required/non-blank server-side), so
 * fall back to the extension when the browser didn't give us a MIME type.
 */
export function resolveContentType(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TO_MIME[extension] ?? "application/octet-stream";
}
