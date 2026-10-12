import { z } from "zod";
import type { Role } from "./step1.schema";
import { requireWhenFilled } from "../shared/conditionalField";

export const POSITION_VALUES = ["goalkeeper", "defender", "midfielder", "forward"] as const;
export const FOOT_VALUES = ["right", "left", "both"] as const;
export const EXPERIENCE_YEARS_VALUES = ["under_1", "1_3", "3_5", "over_5"] as const;
export const PLAYER_EXPERIENCE_LEVEL_VALUES = ["amateur", "semi_pro", "former_pro"] as const;
export const GAME_TYPE_VALUES = ["mini_football", "big_football", "futsal", "tournaments"] as const;
export const SPECIALTY_VALUES = [
  "sports_doctor",
  "doctor",
  "paramedic",
  "physiotherapist",
  "nurse",
  "first_aid_specialist",
] as const;
export const EQUIPMENT_STATUS_VALUES = ["yes", "partial", "no"] as const;
export const COURSE_YEAR_VALUES = ["1", "2", "3", "4"] as const;

/** Last ~30 years, descending — shared by the professional-periods repeater's from/to selects. */
export const PROFESSIONAL_PERIOD_YEARS: number[] = Array.from(
  { length: 30 },
  (_, index) => new Date().getFullYear() - index,
);

export const professionalPeriodSchema = z
  .object({
    start_year: z.number({ required_error: "required", invalid_type_error: "required" }),
    end_year: z.number({ required_error: "required", invalid_type_error: "required" }),
    club: z.string().max(120, "tooLong").optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.start_year > value.end_year) {
      ctx.addIssue({ code: "custom", message: "professionalPeriodOrder", path: ["end_year"] });
    }
  });
export type ProfessionalPeriod = z.infer<typeof professionalPeriodSchema>;

const hourlyRateField = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}, z.number({ required_error: "required", invalid_type_error: "required" }).refine((value) => Number.isFinite(value) && value >= 1, "required"));

export const playerDetailsSchema = z
  .object({
    main_position: z.enum(POSITION_VALUES, { required_error: "required", invalid_type_error: "required" }),
    extra_positions: z.array(z.enum(POSITION_VALUES)).default([]),
    preferred_foot: z.enum(FOOT_VALUES, { required_error: "required", invalid_type_error: "required" }),
    years_playing: z.enum(EXPERIENCE_YEARS_VALUES, { required_error: "required", invalid_type_error: "required" }),
    club_experience_text: z
      .string()
      .max(500, "tooLong")
      .optional()
      .or(z.literal("")),
    experience_level: z.enum(PLAYER_EXPERIENCE_LEVEL_VALUES, {
      required_error: "required",
      invalid_type_error: "required",
    }),
    is_university_student: z.boolean({ required_error: "required", invalid_type_error: "required" }),
    university_name: z.string().max(200, "tooLong").optional().or(z.literal("")),
    course_year: z.enum(COURSE_YEAR_VALUES).optional().or(z.literal("")),
    has_pro_experience: z.boolean({ required_error: "required", invalid_type_error: "required" }),
    hourly_rate_azn: hourlyRateField,
    professional_periods: z.array(professionalPeriodSchema).default([]),
  })
  .superRefine((value, ctx) => {
    requireWhenFilled(
      ctx,
      value.has_pro_experience,
      value.professional_periods,
      ["professional_periods"],
      "professionalPeriodsRequired",
    );
    requireWhenFilled(
      ctx,
      value.is_university_student,
      value.university_name,
      ["university_name"],
      "universityNameRequired",
    );
    requireWhenFilled(
      ctx,
      value.is_university_student,
      value.course_year,
      ["course_year"],
      "courseYearRequired",
    );
  });
export type PlayerDetails = z.infer<typeof playerDetailsSchema>;
export const PLAYER_STEP2_FIELD_ORDER: (keyof PlayerDetails)[] = [
  "main_position",
  "extra_positions",
  "preferred_foot",
  "years_playing",
  "experience_level",
  "is_university_student",
  "university_name",
  "course_year",
  "has_pro_experience",
  "professional_periods",
  "hourly_rate_azn",
  "club_experience_text",
];

export const refereeDetailsSchema = z
  .object({
    has_official_certification: z.boolean({ required_error: "required", invalid_type_error: "required" }),
    certification_name: z
      .string()
      .max(200, "tooLong")
      .optional()
      .or(z.literal("")),
    certification_link: z
      .string()
      .max(500, "tooLong")
      .optional()
      .or(z.literal("")),
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
  "has_official_certification",
  "certification_name",
  "certification_link",
  "years_refereeing",
  "game_types",
  "experience_text",
];

export const medicDetailsSchema = z
  .object({
    specialty: z.array(z.enum(SPECIALTY_VALUES)).min(1, "minSelectionSpecialty"),
    equipment_status: z.enum(EQUIPMENT_STATUS_VALUES, {
      required_error: "required",
      invalid_type_error: "required",
    }),
    equipment_missing_text: z
      .string()
      .max(500, "tooLong")
      .optional()
      .or(z.literal("")),
    work_experience: z.enum(EXPERIENCE_YEARS_VALUES, { required_error: "required", invalid_type_error: "required" }),
    workplace: z
      .string()
      .max(300, "tooLong")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    requireWhenFilled(
      ctx,
      value.equipment_status === "partial",
      value.equipment_missing_text,
      ["equipment_missing_text"],
      "equipmentMissingTextRequired",
    );
  });
export type MedicDetails = z.infer<typeof medicDetailsSchema>;
export const MEDIC_STEP2_FIELD_ORDER: (keyof MedicDetails)[] = [
  "specialty",
  "equipment_status",
  "equipment_missing_text",
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
