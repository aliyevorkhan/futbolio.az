"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { WizardSidebar, type WizardStepMeta } from "@/components/wizard/WizardSidebar";
import { ThankYouScreen } from "@/components/wizard/ThankYouScreen";
import { Step1 } from "@/components/wizard/steps/Step1";
import { Step2 } from "@/components/wizard/steps/Step2";
import { Step3Availability } from "@/components/wizard/steps/Step3Availability";
import { Step4Files } from "@/components/wizard/steps/Step4Files";
import { Step5Consents } from "@/components/wizard/steps/Step5Consents";
import { ApiError } from "@/lib/api/client";
import { submitRegistration } from "@/lib/api/registrations";
import {
  EMPTY_DRAFT,
  loadDraft,
  saveDraft,
  clearDraft,
  type WizardDraftShape,
} from "@/lib/draft/wizardDraft";
import { buildSubmitPayload } from "@/lib/validation/wizard/submitPayload";
import { ROLE_QUERY_PARAM_MAP, type Role, type Step1Data } from "@/lib/validation/wizard/step1.schema";
import type { PlayerDetails, RefereeDetails, MedicDetails } from "@/lib/validation/wizard/step2.schema";
import type { Step3Data } from "@/lib/validation/wizard/step3.schema";
import type { Step5Data } from "@/lib/validation/wizard/step5.schema";

const TOTAL_STEPS = 5;
const AUTOSAVE_DEBOUNCE_MS = 500;

/** Field (or object-key) names in the request body, mapped to the step that owns them. */
const FIELD_TO_STEP: Record<string, number> = {
  role: 1,
  full_name: 1,
  age: 1,
  phone: 1,
  instagram_handle: 1,
  district: 1,
  player_details: 2,
  referee_details: 2,
  medic_details: 2,
  availability: 3,
  upload_session_id: 4,
  file_ids: 4,
  video_link_url: 4,
  consents: 5,
  turnstile_token: 5,
  website: 5,
};

function determineErrorStep(fieldErrors: Record<string, string[]>): number {
  let earliest = TOTAL_STEPS;
  for (const key of Object.keys(fieldErrors)) {
    const step = FIELD_TO_STEP[key];
    if (step && step < earliest) earliest = step;
  }
  return earliest;
}

export function RegistrationWizard() {
  const t = useTranslations("wizard");
  const searchParams = useSearchParams();

  const [hasHydrated, setHasHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [draft, setDraft] = useState<WizardDraftShape>(EMPTY_DRAFT);
  const [fileIds, setFileIds] = useState<string[]>([]);
  const [bannerStep, setBannerStep] = useState<number | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "success">("idle");

  const [uploadSessionId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );

  const formTopRef = useRef<HTMLDivElement>(null);

  // Restore any saved draft / apply the `?rol=` query param after mount
  // only (client-only), to avoid an SSR/hydration content mismatch.
  useEffect(() => {
    const saved = loadDraft();
    const rolParam = searchParams.get("rol");
    const mappedRole = rolParam ? ROLE_QUERY_PARAM_MAP[rolParam] : undefined;

    if (saved) {
      // Files never survive a reload — always land back on Step 4 to
      // re-pick them rather than resuming on Step 5.
      setCurrentStep(saved.currentStep >= 4 ? 4 : saved.currentStep);
      setRole(saved.role ?? mappedRole ?? null);
      setDraft(saved);
    } else if (mappedRole) {
      setRole(mappedRole);
    }
    setHasHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave of every step's typed values (never file bytes —
  // step 4's upload state never enters `draft` in the first place).
  useEffect(() => {
    if (!hasHydrated) return;
    const handle = setTimeout(() => {
      saveDraft({ ...draft, currentStep, role });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [draft, currentStep, role, hasHydrated]);

  const scrollToTop = () => {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    scrollToTop();
  };

  const submitMutation = useMutation({
    mutationFn: submitRegistration,
  });

  const utm = useMemo(
    () => ({
      utm_source: searchParams.get("utm_source") ?? undefined,
      utm_medium: searchParams.get("utm_medium") ?? undefined,
      utm_campaign: searchParams.get("utm_campaign") ?? undefined,
    }),
    [searchParams],
  );

  const steps: WizardStepMeta[] = [
    { step: 1, title: t("sidebar.step1") },
    { step: 2, title: t("sidebar.step2") },
    { step: 3, title: t("sidebar.step3") },
    { step: 4, title: t("sidebar.step4") },
    { step: 5, title: t("sidebar.step5") },
  ];

  if (submitState === "success") {
    return <ThankYouScreen />;
  }

  const banner =
    bannerStep === currentStep && bannerMessage ? (
      <div
        role="alert"
        className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {bannerMessage}
      </div>
    ) : null;

  const handleStep5Submit = async (step5Data: Step5Data, turnstileToken: string) => {
    setDraft((prev) => ({ ...prev, step5: step5Data }));
    setBannerMessage(null);
    setBannerStep(null);

    if (!role) return;

    const payload = buildSubmitPayload({
      step1: draft.step1 as Step1Data,
      role,
      playerDetails: role === "player" ? (draft.step2.player as PlayerDetails) : null,
      refereeDetails: role === "referee" ? (draft.step2.referee as RefereeDetails) : null,
      medicDetails: role === "medic" ? (draft.step2.medic as MedicDetails) : null,
      step3: draft.step3 as Step3Data,
      videoLinkUrl: draft.videoLinkUrl,
      consents: step5Data,
      uploadSessionId,
      fileIds,
      turnstileToken,
      utm,
    });

    try {
      await submitMutation.mutateAsync(payload);
      clearDraft();
      setSubmitState("success");
    } catch (error) {
      if (error instanceof ApiError) {
        const step = determineErrorStep(error.fieldErrors);
        setBannerMessage(step === 5 && error.detail ? error.detail : t("errors.genericSubmitError"));
        setBannerStep(step);
        if (step !== currentStep) goToStep(step);
      } else {
        setBannerMessage(t("errors.genericSubmitError"));
        setBannerStep(5);
      }
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("meta.title")}
        </h1>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <WizardSidebar
          steps={steps}
          currentStep={currentStep}
          progressLabel={t("sidebar.progressLabel", { current: currentStep, total: TOTAL_STEPS })}
        />

        <div ref={formTopRef} className="min-w-0 flex-1 scroll-mt-20">
          {banner}

          {currentStep === 1 ? (
            <Step1
              defaultValues={{ ...draft.step1, role: role ?? undefined } as Partial<Step1Data>}
              onChange={(values) => {
                setDraft((prev) => ({ ...prev, step1: values }));
                if (values.role) setRole(values.role);
              }}
              onValid={(data) => {
                setDraft((prev) => ({ ...prev, step1: data }));
                setRole(data.role);
                goToStep(2);
              }}
            />
          ) : null}

          {currentStep === 2 && role ? (
            <Step2
              role={role}
              playerDefaults={draft.step2.player}
              refereeDefaults={draft.step2.referee}
              medicDefaults={draft.step2.medic}
              onChangePlayer={(values) =>
                setDraft((prev) => ({ ...prev, step2: { ...prev.step2, player: values } }))
              }
              onChangeReferee={(values) =>
                setDraft((prev) => ({ ...prev, step2: { ...prev.step2, referee: values } }))
              }
              onChangeMedic={(values) =>
                setDraft((prev) => ({ ...prev, step2: { ...prev.step2, medic: values } }))
              }
              onValidPlayer={(data) => {
                setDraft((prev) => ({ ...prev, step2: { ...prev.step2, player: data } }));
                goToStep(3);
              }}
              onValidReferee={(data) => {
                setDraft((prev) => ({ ...prev, step2: { ...prev.step2, referee: data } }));
                goToStep(3);
              }}
              onValidMedic={(data) => {
                setDraft((prev) => ({ ...prev, step2: { ...prev.step2, medic: data } }));
                goToStep(3);
              }}
              onBack={() => goToStep(1)}
            />
          ) : null}

          {currentStep === 3 ? (
            <Step3Availability
              defaultValues={draft.step3}
              onChange={(values) => setDraft((prev) => ({ ...prev, step3: values }))}
              onValid={(data) => {
                setDraft((prev) => ({ ...prev, step3: data }));
                goToStep(4);
              }}
              onBack={() => goToStep(2)}
            />
          ) : null}

          {currentStep === 4 && role ? (
            <Step4Files
              role={role}
              uploadSessionId={uploadSessionId}
              videoLinkUrlDefault={draft.videoLinkUrl}
              onValid={({ fileIds: nextFileIds, videoLinkUrl }) => {
                setFileIds(nextFileIds);
                setDraft((prev) => ({ ...prev, videoLinkUrl }));
                goToStep(5);
              }}
              onBack={() => goToStep(3)}
            />
          ) : null}

          {currentStep === 5 ? (
            <Step5Consents
              defaultValues={draft.step5}
              onChange={(values) => setDraft((prev) => ({ ...prev, step5: values }))}
              onValid={handleStep5Submit}
              onBack={() => goToStep(4)}
              isSubmitting={submitMutation.isPending}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
