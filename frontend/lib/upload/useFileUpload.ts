"use client";

import { useCallback, useRef, useState } from "react";
import { presignUpload, completeUpload } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";
import {
  FILE_RULES,
  MULTIPART_THRESHOLD_BYTES,
  isFileKindValid,
  resolveContentType,
  type UploadKind,
} from "@/lib/validation/shared/fileRules";
import type { Role } from "@/lib/validation/wizard/step1.schema";
import { uploadSingle, uploadMultipart } from "./xhrUpload";

export type FileUploadStatus = "idle" | "validating" | "uploading" | "uploaded" | "error";

export interface FileUploadState {
  status: FileUploadStatus;
  file: File | null;
  progress: number;
  error: string | null;
  fileId: string | null;
}

export interface UseFileUploadConfig {
  kind: UploadKind;
  role: Role;
  uploadSessionId: string;
  onUploaded?: (fileId: string) => void;
}

const INITIAL_STATE: FileUploadState = {
  status: "idle",
  file: null,
  progress: 0,
  error: null,
  fileId: null,
};

/**
 * Drives one file slot (one photo, one video, one document) through
 * `idle -> validating -> uploading -> uploaded -> error`. Step 4
 * instantiates one of these per slot (photo: 1, video/document: up to
 * 3 fixed slots) rather than a single hook managing a dynamic list.
 */
export function useFileUpload(config: UseFileUploadConfig) {
  const [state, setState] = useState<FileUploadState>(INITIAL_STATE);
  const activeXhrsRef = useRef<Set<XMLHttpRequest>>(new Set());
  const configRef = useRef(config);
  configRef.current = config;

  const registerXhr = useCallback((xhr: XMLHttpRequest) => {
    activeXhrsRef.current.add(xhr);
  }, []);

  const runUpload = useCallback(async (file: File) => {
    const { kind, role, uploadSessionId, onUploaded } = configRef.current;
    setState({ status: "uploading", file, progress: 0, error: null, fileId: null });

    try {
      const contentType = resolveContentType(file);
      const presign = await presignUpload({
        upload_session_id: uploadSessionId,
        kind,
        filename: file.name,
        content_type: contentType,
        size: file.size,
        role,
      });

      if (presign.mode === "single") {
        await uploadSingle(file, presign.url, contentType, (progress) => {
          setState((prev) => ({ ...prev, progress }));
        }, registerXhr);
        await completeUpload(presign.file_id);
      } else {
        const parts = await uploadMultipart(
          file,
          presign.part_size,
          presign.part_urls,
          (progress) => setState((prev) => ({ ...prev, progress })),
          registerXhr,
        );
        await completeUpload(presign.file_id, { parts });
      }

      setState({ status: "uploaded", file, progress: 100, error: null, fileId: presign.file_id });
      onUploaded?.(presign.file_id);
    } catch (error) {
      const message = error instanceof ApiError ? error.detail ?? "uploadFailed" : "uploadFailed";
      setState({ status: "error", file, progress: 0, error: message, fileId: null });
    } finally {
      activeXhrsRef.current.clear();
    }
  }, [registerXhr]);

  const selectFile = useCallback(
    (file: File) => {
      const result = isFileKindValid(file, configRef.current.kind);
      if (result !== "ok") {
        setState({ status: "error", file, progress: 0, error: result, fileId: null });
        return;
      }
      setState({ status: "validating", file, progress: 0, error: null, fileId: null });
      void runUpload(file);
    },
    [runUpload],
  );

  const retry = useCallback(() => {
    if (state.file) void runUpload(state.file);
  }, [state.file, runUpload]);

  const remove = useCallback(() => {
    activeXhrsRef.current.forEach((xhr) => xhr.abort());
    activeXhrsRef.current.clear();
    setState(INITIAL_STATE);
  }, []);

  return { state, selectFile, retry, remove, accept: FILE_RULES[config.kind].accept, maxBytes: FILE_RULES[config.kind].maxBytes };
}

export { MULTIPART_THRESHOLD_BYTES };
