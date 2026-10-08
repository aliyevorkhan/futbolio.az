import { z } from "zod";
import { DISTRICT_CODES } from "../shared/districts";

export const DAY_VALUES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type DayValue = (typeof DAY_VALUES)[number];

export const HOUR_VALUES = ["18_20", "20_22", "22_00", "weekend_daytime"] as const;
export type HourValue = (typeof HOUR_VALUES)[number];

export const step3Schema = z.object({
  days: z.array(z.enum(DAY_VALUES)).min(1, "minSelectionDays"),
  hours: z.array(z.enum(HOUR_VALUES)).min(1, "minSelectionHours"),
  districts: z.array(z.enum(DISTRICT_CODES)).min(1, "minSelectionDistricts"),
});

export type Step3Data = z.infer<typeof step3Schema>;

export const STEP3_FIELD_ORDER: (keyof Step3Data)[] = ["days", "hours", "districts"];
