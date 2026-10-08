import type { Role, Step1Data } from "./step1.schema";
import type { PlayerDetails, RefereeDetails, MedicDetails } from "./step2.schema";
import type { Step3Data } from "./step3.schema";
import type { Step5Data } from "./step5.schema";
import type { ApplicationSubmitPayload } from "@/lib/api/registrations";

export interface BuildSubmitPayloadInput {
  step1: Step1Data;
  role: Role;
  playerDetails: PlayerDetails | null;
  refereeDetails: RefereeDetails | null;
  medicDetails: MedicDetails | null;
  step3: Step3Data;
  videoLinkUrl: string;
  consents: Step5Data;
  uploadSessionId: string;
  fileIds: string[];
  turnstileToken: string;
  utm: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

/**
 * Composes the final `POST /api/public/applications/` request body from
 * every step's validated data. Kept as a single function (rather than a
 * zod schema) since this is a pure reshape, not something the user
 * types into directly — but its output shape must stay in 1:1 lockstep
 * with the backend contract.
 */
export function buildSubmitPayload(input: BuildSubmitPayloadInput): ApplicationSubmitPayload {
  const payload: ApplicationSubmitPayload = {
    role: input.role,
    full_name: input.step1.full_name,
    age: input.step1.age,
    phone: input.step1.phone,
    district: input.step1.district,
    availability: {
      days: input.step3.days,
      hours: input.step3.hours,
      districts: input.step3.districts,
    },
    upload_session_id: input.uploadSessionId,
    file_ids: input.fileIds,
    consents: [
      { type: "data_processing", accepted: input.consents.data_processing_consent },
      { type: "social_share", accepted: input.consents.social_share_consent },
      { type: "age_18_confirmation", accepted: input.consents.age_confirmation_consent },
    ],
    turnstile_token: input.turnstileToken,
    website: input.consents.website ?? "",
  };

  if (input.step1.instagram_handle) {
    payload.instagram_handle = input.step1.instagram_handle;
  }
  if (input.videoLinkUrl) {
    payload.video_link_url = input.videoLinkUrl;
  }
  if (input.role === "player" && input.playerDetails) {
    payload.player_details = input.playerDetails;
  }
  if (input.role === "referee" && input.refereeDetails) {
    payload.referee_details = input.refereeDetails;
  }
  if (input.role === "medic" && input.medicDetails) {
    payload.medic_details = input.medicDetails;
  }
  if (input.utm.utm_source) payload.utm_source = input.utm.utm_source;
  if (input.utm.utm_medium) payload.utm_medium = input.utm.utm_medium;
  if (input.utm.utm_campaign) payload.utm_campaign = input.utm.utm_campaign;

  return payload;
}
