import { apiFetch } from "@/lib/api/client";
import type { Role } from "@/lib/validation/wizard/step1.schema";
import type { UploadKind } from "@/lib/validation/shared/fileRules";

/**
 * Real contract for the presigned-upload flow:
 *   POST /api/public/uploads/presign/
 *   POST /api/public/uploads/<file_id>/complete/
 * See `lib/upload/useFileUpload.ts` for how these are driven (XHR PUTs
 * with progress, single vs. multipart).
 */

export interface PresignUploadRequest {
  upload_session_id: string;
  kind: UploadKind;
  filename: string;
  content_type: string;
  size: number;
  role: Role;
}

export interface PresignSingleResponse {
  mode: "single";
  file_id: string;
  url: string;
}

export interface PresignMultipartResponse {
  mode: "multipart";
  file_id: string;
  upload_id: string;
  part_size: number;
  part_urls: string[];
}

export type PresignUploadResponse = PresignSingleResponse | PresignMultipartResponse;

export interface CompleteUploadPart {
  part_number: number;
  etag: string;
}

export interface CompleteUploadRequest {
  parts?: CompleteUploadPart[];
}

export interface CompleteUploadResponse {
  status: "pending_verification";
  file_id: string;
}

export function presignUpload(
  payload: PresignUploadRequest,
): Promise<PresignUploadResponse> {
  return apiFetch<PresignUploadResponse>("/api/public/uploads/presign/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function completeUpload(
  fileId: string,
  body: CompleteUploadRequest = {},
): Promise<CompleteUploadResponse> {
  return apiFetch<CompleteUploadResponse>(`/api/public/uploads/${fileId}/complete/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
