import type { Role, Step1Data } from "@/lib/validation/wizard/step1.schema";
import type { PlayerDetails, RefereeDetails, MedicDetails } from "@/lib/validation/wizard/step2.schema";
import type { Step3Data } from "@/lib/validation/wizard/step3.schema";
import type { Step5Data } from "@/lib/validation/wizard/step5.schema";

/**
 * Versioned localStorage key for the wizard's autosaved draft. Bump the
 * version suffix if the shape changes incompatibly so old drafts are
 * ignored instead of crashing the restore logic.
 */
export const DRAFT_STORAGE_KEY = "futbolio.registration.draft.v1";

export interface WizardDraftShape {
  currentStep: number;
  role: Role | null;
  step1: Partial<Step1Data>;
  step2: {
    player: Partial<PlayerDetails>;
    referee: Partial<RefereeDetails>;
    medic: Partial<MedicDetails>;
  };
  step3: Partial<Step3Data>;
  step5: Partial<Step5Data>;
  videoLinkUrl: string;
}

export const EMPTY_DRAFT: WizardDraftShape = {
  currentStep: 1,
  role: null,
  step1: {},
  step2: { player: {}, referee: {}, medic: {} },
  step3: {},
  step5: {},
  videoLinkUrl: "",
};

/**
 * Note: Step 4's actual upload-slot state (progress, File references,
 * server file ids) is never part of this object in the first place — it
 * lives in `Step4Files`' own component state — so there is nothing
 * step-4-shaped to strip here. We still pass a JSON `replacer` on save
 * as defense-in-depth in case a `File`/`FileList` ever ends up nested in
 * here by accident; a reload always restores steps 1/2/3/5 and sends
 * the user back to step 4 to re-pick files, since uploaded bytes can
 * never survive a reload anyway.
 */
function stripFileValues(_key: string, value: unknown): unknown {
  if (typeof FileList !== "undefined" && value instanceof FileList) return undefined;
  if (typeof File !== "undefined" && value instanceof File) return undefined;
  return value;
}

export function saveDraft(draft: WizardDraftShape): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft, stripFileValues));
  } catch {
    // Storage full/unavailable (private mode etc.) — autosave is best-effort.
  }
}

export function loadDraft(): WizardDraftShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WizardDraftShape>;
    return {
      currentStep: typeof parsed.currentStep === "number" ? parsed.currentStep : 1,
      role: parsed.role ?? null,
      step1: parsed.step1 ?? {},
      step2: {
        player: parsed.step2?.player ?? {},
        referee: parsed.step2?.referee ?? {},
        medic: parsed.step2?.medic ?? {},
      },
      step3: parsed.step3 ?? {},
      step5: parsed.step5 ?? {},
      videoLinkUrl: typeof parsed.videoLinkUrl === "string" ? parsed.videoLinkUrl : "",
    };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
