import { apiFetch } from "@/lib/api/client";
import type { Role } from "@/lib/validation/wizard/step1.schema";
import type { DistrictCode } from "@/lib/validation/shared/districts";
import type { PlayerDetails, RefereeDetails, MedicDetails } from "@/lib/validation/wizard/step2.schema";

/**
 * Real contract for `POST /api/public/applications/` — the final atomic
 * registration submission. Field names match the DRF serializer 1:1;
 * see `lib/validation/wizard/submitPayload.ts` for how this is composed
 * from the wizard's per-step state.
 */

export type ConsentType = "data_processing" | "social_share" | "age_18_confirmation";

export interface ConsentEntry {
  type: ConsentType;
  accepted: boolean;
}

export interface ApplicationSubmitPayload {
  role: Role;
  full_name: string;
  date_of_birth: string;
  phone: string;
  instagram_handle?: string;
  district: DistrictCode;
  player_details?: PlayerDetails;
  referee_details?: RefereeDetails;
  medic_details?: MedicDetails;
  video_link_url?: string;
  availability: {
    time_slots: string[];
    districts: DistrictCode[];
  };
  upload_session_id: string;
  file_ids: string[];
  consents: ConsentEntry[];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  turnstile_token: string;
  /** Honeypot — must always be sent as "" by real users. */
  website: string;
}

export interface ApplicationSubmitResponse {
  id: string;
}

export function submitRegistration(
  payload: ApplicationSubmitPayload,
): Promise<ApplicationSubmitResponse> {
  return apiFetch<ApplicationSubmitResponse>("/api/public/applications/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Checked when the candidate advances past Step 1 (not on blur, not only
 * at final submit) — one phone number may have at most one registration
 * across every role. The final `POST /api/public/applications/` above
 * still re-checks this itself (`ApplicationCreateSerializer.validate_phone`)
 * as a backstop against a direct API call bypassing this earlier check.
 */
export function checkPhoneAvailability(phone: string): Promise<{ available: boolean }> {
  return apiFetch<{ available: boolean }>("/api/public/applications/check-phone/", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}
