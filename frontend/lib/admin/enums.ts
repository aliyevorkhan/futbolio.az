/**
 * Mirrors `common/enums.py` on the backend — machine-readable codes only.
 * Display labels live in `messages/az.json` under `admin.enums.*` and are
 * resolved via `useTranslations("admin")` + `t(\`enums.<category>.<code>\`)`,
 * never hardcoded here.
 */

export const APPLICATION_ROLES = ["player", "referee", "medic"] as const;

export const DISTRICTS = [
  "binegedi",
  "xetai",
  "xezer",
  "qaradag",
  "nerimanov",
  "nesimi",
  "nizami",
  "pirallahi",
  "sabuncu",
  "sebail",
  "suraxani",
  "yasamal",
] as const;

export const APPLICATION_STATUSES = [
  "new",
  "reviewed",
  "contacted",
  "accepted",
  "rejected",
  "archived",
] as const;

export const MAIN_POSITIONS = ["goalkeeper", "defender", "midfielder", "forward"] as const;

export const PREFERRED_FEET = ["right", "left", "both"] as const;

/** Shared across years_playing / years_refereeing / work_experience. */
export const DURATIONS = ["under_1", "1_3", "3_5", "over_5"] as const;

export const PLAYER_EXPERIENCE_LEVELS = ["amateur", "semi_pro", "former_pro"] as const;

export const FIRST_AID_EQUIPMENT_STATUSES = ["yes", "partial", "no"] as const;

export const GAME_TYPES = ["mini_football", "big_football", "futsal", "tournaments"] as const;

export const MEDIC_SPECIALTIES = [
  "sports_doctor",
  "doctor",
  "paramedic",
  "physiotherapist",
  "nurse",
  "first_aid_specialist",
] as const;

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const HOUR_SLOTS = ["09_12", "12_15", "15_18", "18_21", "21_24"] as const;

export const FILE_KINDS = ["photo", "video", "document"] as const;

export const ADMIN_ROLES = ["admin", "super_admin"] as const;
