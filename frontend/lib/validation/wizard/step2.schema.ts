import { z } from "zod";
import type { Role } from "./step1.schema";

export const POSITION_VALUES = ["goalkeeper", "defender", "midfielder", "forward"] as const;
export const FOOT_VALUES = ["right", "left", "both"] as const;
export const EXPERIENCE_YEARS_VALUES = ["under_1", "1_3", "3_5", "over_5"] as const;
export const LICENSE_STATUS_VALUES = ["licensed", "course_completed", "experienced_unlicensed"] as const;
export const GAME_TYPE_VALUES = ["mini_football", "big_football", "futsal", "tournaments"] as const;
export const SPECIALTY_VALUES = [
  "sports_doctor",
  "doctor",
  "paramedic",
  "physiotherapist",
  "nurse",
] as const;

const selfRatingField = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}, z.number({ required_error: "selfRatingRequired", invalid_type_error: "selfRatingRequired" }).refine((value) => Number.isFinite(value) && value >= 1 && value <= 5, "selfRatingRequired"));

export const playerDetailsSchema = z.object({
  main_position: z.enum(POSITION_VALUES, { required_error: "required", invalid_type_error: "required" }),
  extra_positions: z.array(z.enum(POSITION_VALUES)).default([]),
  preferred_foot: z.enum(FOOT_VALUES, { required_error: "required", invalid_type_error: "required" }),
  years_playing: z.enum(EXPERIENCE_YEARS_VALUES, { required_error: "required", invalid_type_error: "required" }),
  club_experience_text: z
    .string()
    .max(500, "tooLong")
    .optional()
    .or(z.literal("")),
  self_rating: selfRatingField,
});
export type PlayerDetails = z.infer<typeof playerDetailsSchema>;
export const PLAYER_STEP2_FIELD_ORDER: (keyof PlayerDetails)[] = [
  "main_position",
  "extra_positions",
  "preferred_foot",
  "years_playing",
  "club_experience_text",
  "self_rating",
];

export const refereeDetailsSchema = z.object({
  license_status: z.enum(LICENSE_STATUS_VALUES, { required_error: "required", invalid_type_error: "required" }),
  years_refereeing: z.enum(EXPERIENCE_YEARS_VALUES, { required_error: "required", invalid_type_error: "required" }),
  game_types: z.array(z.enum(GAME_TYPE_VALUES)).min(1, "minSelectionGameTypes"),
  experience_text: z
    .string()
    .max(500, "tooLong")
    .optional()
    .or(z.literal("")),
});
export type RefereeDetails = z.infer<typeof refereeDetailsSchema>;
export const REFEREE_STEP2_FIELD_ORDER: (keyof RefereeDetails)[] = [
  "license_status",
  "years_refereeing",
  "game_types",
  "experience_text",
];

export const medicDetailsSchema = z.object({
  specialty: z.enum(SPECIALTY_VALUES, { required_error: "required", invalid_type_error: "required" }),
  first_aid_cert: z.boolean({ required_error: "required", invalid_type_error: "required" }),
  work_experience: z.enum(EXPERIENCE_YEARS_VALUES, { required_error: "required", invalid_type_error: "required" }),
  workplace: z
    .string()
    .max(300, "tooLong")
    .optional()
    .or(z.literal("")),
});
export type MedicDetails = z.infer<typeof medicDetailsSchema>;
export const MEDIC_STEP2_FIELD_ORDER: (keyof MedicDetails)[] = [
  "specialty",
  "first_aid_cert",
  "work_experience",
  "workplace",
];

export function getStep2Schema(role: Role) {
  switch (role) {
    case "player":
      return playerDetailsSchema;
    case "referee":
      return refereeDetailsSchema;
    case "medic":
      return medicDetailsSchema;
  }
}

export type Step2Data = PlayerDetails | RefereeDetails | MedicDetails;
