"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChipSingleSelect, ChipMultiSelect } from "@/components/wizard/fields/ChipGroup";
import { FileDropzone } from "@/components/wizard/fields/FileDropzone";
import { StepFooter } from "@/components/wizard/StepFooter";
import { useFileUpload } from "@/lib/upload/useFileUpload";
import { useFocusFirstInvalidField } from "@/lib/validation/useFocusFirstInvalidField";
import {
  refereeDetailsSchema,
  EXPERIENCE_YEARS_VALUES,
  GAME_TYPE_VALUES,
  REFEREE_STEP2_FIELD_ORDER,
  type RefereeDetails as RefereeDetailsData,
} from "@/lib/validation/wizard/step2.schema";

interface RefereeDetailsProps {
  defaultValues: Partial<RefereeDetailsData>;
  uploadSessionId: string;
  certificateFileId: string | null;
  onCertificateFileIdChange: (fileId: string | null) => void;
  onValid: (data: RefereeDetailsData) => void;
  onChange: (values: Partial<RefereeDetailsData>) => void;
  onBack: () => void;
}

export function RefereeDetails({
  defaultValues,
  uploadSessionId,
  certificateFileId,
  onCertificateFileIdChange,
  onValid,
  onChange,
  onBack,
}: RefereeDetailsProps) {
  const t = useTranslations("wizard.step2.referee");
  const tErrors = useTranslations("wizard.errors");
  const tCommon = useTranslations("wizard.common");
  const tStep4 = useTranslations("wizard.step4");

  const form = useForm<RefereeDetailsData>({
    resolver: zodResolver(refereeDetailsSchema),
    mode: "onSubmit",
    defaultValues: {
      has_official_certification: defaultValues.has_official_certification,
      certification_name: defaultValues.certification_name ?? "",
      certification_link: defaultValues.certification_link ?? "",
      years_refereeing: defaultValues.years_refereeing,
      game_types: defaultValues.game_types ?? [],
      experience_text: defaultValues.experience_text ?? "",
    } as RefereeDetailsData,
  });

  useEffect(() => {
    const subscription = form.watch((values) => onChange(values as Partial<RefereeDetailsData>));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const { registerField, liveRegionRef } = useFocusFirstInvalidField(
    form.formState.errors as Record<string, { message?: unknown } | undefined>,
    REFEREE_STEP2_FIELD_ORDER,
  );

  const errorMessage = (field: keyof RefereeDetailsData) => {
    const message = form.formState.errors[field]?.message;
    return message ? tErrors(message as string) : undefined;
  };

  const yearsOptions = EXPERIENCE_YEARS_VALUES.map((value) => ({ value, label: t(`years.${value}`) }));
  const gameTypeOptions = GAME_TYPE_VALUES.map((value) => ({ value, label: t(`gameTypes.${value}`) }));
  const yesNoOptions = [
    { value: "true", label: tCommon("yes") },
    { value: "false", label: tCommon("no") },
  ];

  const hasOfficialCertification = form.watch("has_official_certification");
  const certificationName = form.watch("certification_name");
  const certificationLink = form.watch("certification_link");

  const certificateUpload = useFileUpload({ kind: "document", role: "referee", uploadSessionId });

  // Clear any in-progress/uploaded certificate proof (file, name, link)
  // the moment the user switches the certification question back to
  // "Xeyr" — none of it is relevant or required once that's false.
  useEffect(() => {
    if (hasOfficialCertification === false) {
      if (certificateUpload.state.status !== "idle") certificateUpload.remove();
      if (form.getValues("certification_name")) form.setValue("certification_name", "");
      if (form.getValues("certification_link")) form.setValue("certification_link", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOfficialCertification]);

  useEffect(() => {
    if (certificateUpload.state.status === "uploaded") {
      onCertificateFileIdChange(certificateUpload.state.fileId);
    } else if (certificateUpload.state.status === "idle") {
      onCertificateFileIdChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateUpload.state.status, certificateUpload.state.fileId]);

  const statusLabels = {
    uploading: tStep4("status.uploading"),
    uploaded: tStep4("status.uploaded"),
    error: tStep4("status.error"),
  };

  const handleValid = (data: RefereeDetailsData) => {
    if (
      data.has_official_certification &&
      !data.certification_name?.trim() &&
      !data.certification_link?.trim() &&
      !certificateFileId
    ) {
      form.setError("certification_name", { type: "manual", message: "certificationProofRequired" });
      return;
    }
    onValid(data);
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(handleValid)} className="space-y-6">
      <div ref={liveRegionRef} aria-live="assertive" role="alert" className="sr-only" />

      <Controller
        control={form.control}
        name="has_official_certification"
        render={({ field }) => (
          <ChipSingleSelect
            name="has_official_certification"
            label={t("hasOfficialCertificationLabel")}
            value={field.value === undefined ? undefined : String(field.value)}
            onChange={(value) => field.onChange(value === "true")}
            options={yesNoOptions}
            error={errorMessage("has_official_certification")}
            registerRef={registerField("has_official_certification")}
          />
        )}
      />

      {hasOfficialCertification ? (
        <div className="animate-role-fade-in space-y-4 rounded-xl bg-brand-green/10 p-4">
          <p className="text-xs text-muted">{t("certificationProofHint")}</p>

          <div>
            <Label htmlFor="certification_name">{t("certificationNameLabel")}</Label>
            <Input
              id="certification_name"
              placeholder={t("certificationNamePlaceholder")}
              aria-invalid={Boolean(form.formState.errors.certification_name)}
              {...form.register("certification_name")}
              ref={(el) => {
                form.register("certification_name").ref(el);
                registerField("certification_name")(el);
              }}
            />
          </div>

          <div>
            <Label htmlFor="certification_link">{t("certificationLinkLabel")}</Label>
            <Input
              id="certification_link"
              placeholder={t("certificationLinkPlaceholder")}
              {...form.register("certification_link")}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t("certificationFileLabel")}</p>
            <FileDropzone
              label=""
              accept={certificateUpload.accept}
              state={certificateUpload.state}
              onSelect={certificateUpload.selectFile}
              onRemove={certificateUpload.remove}
              onRetry={certificateUpload.retry}
              browseLabel={t("certificationFileBrowse")}
              dragLabel={t("certificationFileDrag")}
              errorLabels={{
                invalidFileType: tErrors("invalidFileType"),
                fileTooLarge: tErrors("fileTooLarge"),
                uploadFailed: tErrors("uploadFailed"),
              }}
              statusLabels={statusLabels}
              removeLabel={tCommon("remove")}
              retryLabel={tCommon("retry")}
            />
          </div>

          {errorMessage("certification_name") ? (
            <p className="text-sm text-red-600">{errorMessage("certification_name")}</p>
          ) : null}
        </div>
      ) : null}

      <Controller
        control={form.control}
        name="years_refereeing"
        render={({ field }) => (
          <ChipSingleSelect
            name="years_refereeing"
            label={t("yearsRefereeingLabel")}
            value={field.value}
            onChange={field.onChange}
            options={yearsOptions}
            error={errorMessage("years_refereeing")}
            registerRef={registerField("years_refereeing")}
          />
        )}
      />

      <Controller
        control={form.control}
        name="game_types"
        render={({ field }) => (
          <ChipMultiSelect
            label={t("gameTypesLabel")}
            values={field.value ?? []}
            onChange={field.onChange}
            options={gameTypeOptions}
            error={errorMessage("game_types")}
            registerRef={registerField("game_types")}
          />
        )}
      />

      <div>
        <Label htmlFor="experience_text">{t("experienceLabel")}</Label>
        <textarea
          id="experience_text"
          placeholder={t("experiencePlaceholder")}
          rows={3}
          className="flex w-full rounded-lg border border-brand-dark/15 bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-muted-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
          {...form.register("experience_text")}
        />
        {errorMessage("experience_text") ? (
          <p className="mt-1.5 text-sm text-red-600">{errorMessage("experience_text")}</p>
        ) : null}
      </div>

      <StepFooter onBack={onBack} />
    </form>
  );
}
