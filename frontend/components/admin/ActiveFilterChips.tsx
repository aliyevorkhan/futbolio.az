"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { COURSE_YEARS, MAIN_POSITIONS, MEDIC_SPECIALTIES } from "@/lib/admin/enums";

/** Keys shown as one chip per comma-separated value (multi-select filters). */
const MULTI_VALUE_KEYS = ["status", "position", "level"] as const;

/** Keys shown as a single chip with a plain label + raw value. */
const SINGLE_VALUE_KEYS = [
  "role",
  "district",
  "date_from",
  "date_to",
  "price_min",
  "price_max",
  "is_student",
  "university",
  "course_year",
  "referee_certified",
  "medic_has_document",
  "age_min",
  "age_max",
  "has_pro_experience",
  "has_video",
  "admin_rating_min",
] as const;

function enumLabel(key: string, value: string, tEnums: (k: string) => string): string {
  if (key === "role") return tEnums(`role.${value}`);
  if (key === "district") return tEnums(`district.${value}`);
  if (key === "status") return tEnums(`status.${value}`);
  if (key === "level") return tEnums(`experienceLevel.${value}`);
  if (key === "position") {
    if ((MAIN_POSITIONS as readonly string[]).includes(value)) return tEnums(`mainPosition.${value}`);
    if ((MEDIC_SPECIALTIES as readonly string[]).includes(value)) return tEnums(`specialty.${value}`);
  }
  return value;
}

export function ActiveFilterChips() {
  const t = useTranslations("admin.applications.filters");
  const tEnums = useTranslations("admin.enums");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function removeValue(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== undefined) {
      const remaining = (params.get(key) ?? "")
        .split(",")
        .filter(Boolean)
        .filter((v) => v !== value);
      if (remaining.length > 0) params.set(key, remaining.join(","));
      else params.delete(key);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  const chips: { key: string; value?: string; label: string }[] = [];

  for (const key of MULTI_VALUE_KEYS) {
    const raw = searchParams.get(key);
    if (!raw) continue;
    for (const value of raw.split(",").filter(Boolean)) {
      chips.push({ key, value, label: enumLabel(key, value, tEnums) });
    }
  }

  for (const key of SINGLE_VALUE_KEYS) {
    const raw = searchParams.get(key);
    if (!raw) continue;
    const prefix = key in FIELD_LABEL_KEYS ? t(FIELD_LABEL_KEYS[key as keyof typeof FIELD_LABEL_KEYS]) : key;
    const valueLabel =
      key === "role" || key === "district"
        ? enumLabel(key, raw, tEnums)
        : key === "course_year" && (COURSE_YEARS as readonly string[]).includes(raw)
          ? raw
          : raw === "yes"
            ? t("yesNo.yes")
            : raw === "no"
              ? t("yesNo.no")
              : raw;
    chips.push({ key, label: `${prefix}: ${valueLabel}` });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, index) => (
        <span
          key={`${chip.key}-${chip.value ?? "single"}-${index}`}
          className="flex items-center gap-1.5 rounded-full bg-brand-dark/5 px-3 py-1 text-sm text-foreground"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => removeValue(chip.key, chip.value)}
            aria-label={`${chip.label} ×`}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}

const FIELD_LABEL_KEYS = {
  role: "role",
  district: "district",
  date_from: "dateFrom",
  date_to: "dateTo",
  price_min: "priceMin",
  price_max: "priceMax",
  is_student: "isStudent",
  university: "university",
  course_year: "courseYear",
  referee_certified: "refereeCertified",
  medic_has_document: "medicHasDocument",
  age_min: "ageMin",
  age_max: "ageMax",
  has_pro_experience: "hasProExperience",
  has_video: "hasVideo",
  admin_rating_min: "adminRatingMin",
} as const;
