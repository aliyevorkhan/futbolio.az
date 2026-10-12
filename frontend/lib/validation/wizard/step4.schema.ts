import { z } from "zod";
import type { Role } from "./step1.schema";
import { isValidVideoLinkUrl } from "../shared/videoLink";

/**
 * Step 4's zod schemas validate FILE SLOT METADATA ONLY (counts,
 * presence, link format) — never file bytes, which were already
 * enforced at file-pick time via `lib/validation/shared/fileRules.ts`.
 * The wizard builds this plain object from current upload-slot state
 * right before validating, it is not RHF-registered input.
 */
export interface Step4Input {
  photo_uploaded: boolean;
  video_uploaded_count: number;
  video_link_url: string;
  document_uploaded_count: number;
}

function videoLinkOk(value: string): boolean {
  return value === "" || isValidVideoLinkUrl(value);
}

const photoRequired = z.literal(true, { message: "filesRequired" });

export const playerStep4Schema = z
  .object({
    photo_uploaded: photoRequired,
    video_uploaded_count: z.number().min(0).max(3),
    video_link_url: z.string(),
    document_uploaded_count: z.number(),
  })
  .refine((value) => value.video_uploaded_count >= 1 || value.video_link_url !== "", {
    message: "videoRequired",
    path: ["video_uploaded_count"],
  })
  .refine((value) => videoLinkOk(value.video_link_url), {
    message: "invalidVideoUrl",
    path: ["video_link_url"],
  });

export const refereeStep4Schema = z.object({
  photo_uploaded: photoRequired,
  // Referee submissions no longer collect video at all — the
  // certification document itself is now collected inline in Step 2.
  video_uploaded_count: z.number().max(0),
  video_link_url: z.string(),
  document_uploaded_count: z.number(),
});

export const medicStep4Schema = z.object({
  photo_uploaded: photoRequired,
  video_uploaded_count: z.number(),
  video_link_url: z.string(),
  // Mandatory diploma/certificate document, 1-3 files.
  document_uploaded_count: z.number().min(1, "filesRequired").max(3, "filesRequired"),
});

export function getStep4Schema(role: Role) {
  switch (role) {
    case "player":
      return playerStep4Schema;
    case "referee":
      return refereeStep4Schema;
    case "medic":
      return medicStep4Schema;
  }
}
