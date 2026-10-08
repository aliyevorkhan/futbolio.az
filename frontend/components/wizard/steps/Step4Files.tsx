"use client";

import { useState, type FormEvent, type Ref } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StepFooter } from "@/components/wizard/StepFooter";
import { FileDropzone } from "@/components/wizard/fields/FileDropzone";
import { useFileUpload } from "@/lib/upload/useFileUpload";
import { useFocusFirstInvalidField } from "@/lib/validation/useFocusFirstInvalidField";
import { getStep4Schema, type Step4Input } from "@/lib/validation/wizard/step4.schema";
import type { Role } from "@/lib/validation/wizard/step1.schema";

interface Step4Props {
  role: Role;
  uploadSessionId: string;
  videoLinkUrlDefault: string;
  onValid: (result: { fileIds: string[]; videoLinkUrl: string }) => void;
  onBack: () => void;
}

const STEP4_FIELD_ORDER = [
  "photo_uploaded",
  "video_uploaded_count",
  "video_link_url",
  "document_uploaded_count",
];

export function Step4Files({ role, uploadSessionId, videoLinkUrlDefault, onValid, onBack }: Step4Props) {
  const t = useTranslations("wizard.step4");
  const tErrors = useTranslations("wizard.errors");
  const tCommon = useTranslations("wizard.common");

  const [videoLinkUrl, setVideoLinkUrl] = useState(videoLinkUrlDefault);
  const [errors, setErrors] = useState<Record<string, { message: string } | undefined>>({});

  const photoUpload = useFileUpload({ kind: "photo", role, uploadSessionId });
  const videoUpload0 = useFileUpload({ kind: "video", role, uploadSessionId });
  const videoUpload1 = useFileUpload({ kind: "video", role, uploadSessionId });
  const videoUpload2 = useFileUpload({ kind: "video", role, uploadSessionId });
  const documentUpload0 = useFileUpload({ kind: "document", role, uploadSessionId });
  const documentUpload1 = useFileUpload({ kind: "document", role, uploadSessionId });
  const documentUpload2 = useFileUpload({ kind: "document", role, uploadSessionId });
  const videoUploads = [videoUpload0, videoUpload1, videoUpload2];
  const documentUploads = [documentUpload0, documentUpload1, documentUpload2];

  const { registerField, liveRegionRef } = useFocusFirstInvalidField(errors, STEP4_FIELD_ORDER);

  const statusLabels = {
    uploading: t("status.uploading"),
    uploaded: t("status.uploaded"),
    error: t("status.error"),
  };
  const fileErrorLabels = {
    invalidFileType: tErrors("invalidFileType"),
    fileTooLarge: tErrors("fileTooLarge"),
    uploadFailed: tErrors("uploadFailed"),
  };

  const errorMessage = (field: string) => {
    const message = errors[field]?.message;
    return message ? tErrors(message) : undefined;
  };

  const handleContinue = (event: FormEvent) => {
    event.preventDefault();

    const input: Step4Input = {
      photo_uploaded: photoUpload.state.status === "uploaded",
      video_uploaded_count: videoUploads.filter((v) => v.state.status === "uploaded").length,
      video_link_url: videoLinkUrl.trim(),
      document_uploaded_count: documentUploads.filter((d) => d.state.status === "uploaded").length,
    };

    const result = getStep4Schema(role).safeParse(input);
    if (!result.success) {
      const nextErrors: Record<string, { message: string }> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "photo_uploaded");
        if (!nextErrors[key]) nextErrors[key] = { message: issue.message };
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    const fileIds = [
      photoUpload.state.fileId,
      ...videoUploads.map((v) => v.state.fileId),
      ...documentUploads.map((d) => d.state.fileId),
    ].filter((id): id is string => Boolean(id));

    onValid({ fileIds, videoLinkUrl: videoLinkUrl.trim() });
  };

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold tracking-tight text-foreground">{t("title")}</h2>
      <p className="mb-6 text-muted">{t("description")}</p>

      <form noValidate onSubmit={handleContinue} className="space-y-8">
        <div ref={liveRegionRef} aria-live="assertive" role="alert" className="sr-only" />

        <FileDropzone
          label={t("photo.label")}
          hint={t("photo.hint")}
          accept={photoUpload.accept}
          state={photoUpload.state}
          onSelect={photoUpload.selectFile}
          onRemove={photoUpload.remove}
          onRetry={photoUpload.retry}
          browseLabel={t("dropzone.browseButton")}
          dragLabel={t("dropzone.instructions")}
          errorLabels={fileErrorLabels}
          statusLabels={statusLabels}
          removeLabel={tCommon("remove")}
          retryLabel={tCommon("retry")}
          registerRef={registerField("photo_uploaded")}
          error={errorMessage("photo_uploaded")}
        />

        {role !== "medic" ? (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t("video.label")}</p>
            <p className="mb-3 text-xs text-muted">{t("video.hint")}</p>
            <div
              ref={registerField("video_uploaded_count") as Ref<HTMLDivElement>}
              tabIndex={-1}
              className="grid gap-3 sm:grid-cols-3"
            >
              {videoUploads.map((upload, index) => (
                <FileDropzone
                  key={index}
                  label={`${t("video.label")} ${index + 1}`}
                  accept={upload.accept}
                  state={upload.state}
                  onSelect={upload.selectFile}
                  onRemove={upload.remove}
                  onRetry={upload.retry}
                  browseLabel={t("dropzone.browseButton")}
                  dragLabel={t("dropzone.instructions")}
                  errorLabels={fileErrorLabels}
                  statusLabels={statusLabels}
                  removeLabel={tCommon("remove")}
                  retryLabel={tCommon("retry")}
                />
              ))}
            </div>
            {errorMessage("video_uploaded_count") ? (
              <p className="mt-2 text-sm text-red-600">{errorMessage("video_uploaded_count")}</p>
            ) : null}

            <div className="mt-4">
              <Label htmlFor="video_link_url">{t("video.linkLabel")}</Label>
              <Input
                id="video_link_url"
                placeholder={t("video.linkPlaceholder")}
                value={videoLinkUrl}
                aria-invalid={Boolean(errors.video_link_url)}
                onChange={(event) => setVideoLinkUrl(event.target.value)}
                ref={registerField("video_link_url")}
              />
              {errorMessage("video_link_url") ? (
                <p className="mt-1.5 text-sm text-red-600">{errorMessage("video_link_url")}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t("document.label")}</p>
            <p className="mb-3 text-xs text-muted">{t("document.hint")}</p>
            <div
              ref={registerField("document_uploaded_count") as Ref<HTMLDivElement>}
              tabIndex={-1}
              className="grid gap-3 sm:grid-cols-3"
            >
              {documentUploads.map((upload, index) => (
                <FileDropzone
                  key={index}
                  label={`${t("document.label")} ${index + 1}`}
                  accept={upload.accept}
                  state={upload.state}
                  onSelect={upload.selectFile}
                  onRemove={upload.remove}
                  onRetry={upload.retry}
                  browseLabel={t("dropzone.browseButton")}
                  dragLabel={t("dropzone.instructions")}
                  errorLabels={fileErrorLabels}
                  statusLabels={statusLabels}
                  removeLabel={tCommon("remove")}
                  retryLabel={tCommon("retry")}
                />
              ))}
            </div>
            {errorMessage("document_uploaded_count") ? (
              <p className="mt-2 text-sm text-red-600">{errorMessage("document_uploaded_count")}</p>
            ) : null}
          </div>
        )}

        <StepFooter onBack={onBack} />
      </form>
    </div>
  );
}
