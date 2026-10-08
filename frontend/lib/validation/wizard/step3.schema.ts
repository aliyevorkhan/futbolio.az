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

// 5 slots (replacing the old 4 global hour-ranges) — matches the
// backend's `common.enums.HourSlot` exactly.
export const HOUR_SLOT_VALUES = ["09_12", "12_15", "15_18", "18_21", "21_24"] as const;
export type HourSlotValue = (typeof HOUR_SLOT_VALUES)[number];

/** `"day:slot"` composite string, e.g. `"monday:09_12"` — the exact wire shape of `time_slots`. */
export type TimeSlotKey = `${DayValue}:${HourSlotValue}`;

export const step3Schema = z.object({
  time_slots: z.array(z.string()).min(1, "minSelectionTimeSlots"),
  districts: z.array(z.enum(DISTRICT_CODES)).min(1, "minSelectionDistricts"),
});

export type Step3Data = z.infer<typeof step3Schema>;

export const STEP3_FIELD_ORDER: (keyof Step3Data)[] = ["time_slots", "districts"];
