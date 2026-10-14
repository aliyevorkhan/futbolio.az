"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MultiSelectFilter } from "@/components/admin/MultiSelectFilter";
import { UniversityFilterInput } from "@/components/admin/UniversityFilterInput";
import {
  APPLICATION_ROLES,
  APPLICATION_STATUSES,
  COURSE_YEARS,
  DISTRICTS,
  MAIN_POSITIONS,
  MEDIC_SPECIALTIES,
  PLAYER_EXPERIENCE_LEVELS,
} from "@/lib/admin/enums";

const FILTER_KEYS = [
  "role",
  "district",
  "status",
  "date_from",
  "date_to",
  "level",
  "level_source",
  "position",
  "position_mode",
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

type FilterKey = (typeof FILTER_KEYS)[number];

// Filter keys that are only meaningful for one role — hidden (and so
// never applied) unless that exact role is the selected one, per spec
// section 4A ("hər rol üçün yalnız ona aid filtrlər görünsün").
const PLAYER_ONLY_KEYS: FilterKey[] = [
  "position",
  "position_mode",
  "level",
  "level_source",
  "price_min",
  "price_max",
  "is_student",
  "university",
  "course_year",
  "has_pro_experience",
];
const REFEREE_ONLY_KEYS: FilterKey[] = ["referee_certified"];
const MEDIC_ONLY_KEYS: FilterKey[] = ["medic_has_document"];

export function ApplicationsFilters() {
  const t = useTranslations("admin.applications.filters");
  const tEnums = useTranslations("admin.enums");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [draft, setDraft] = useState<Record<FilterKey, string>>(() => {
    const initial = {} as Record<FilterKey, string>;
    for (const key of FILTER_KEYS) initial[key] = searchParams.get(key) ?? "";
    return initial;
  });

  function setField(key: FilterKey, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value === "__all__" ? "" : value }));
  }

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) {
      const hidden =
        (PLAYER_ONLY_KEYS.includes(key) && draft.role !== "player") ||
        (REFEREE_ONLY_KEYS.includes(key) && draft.role !== "referee") ||
        (MEDIC_ONLY_KEYS.includes(key) && draft.role !== "medic");
      if (!hidden && draft[key]) params.set(key, draft[key]);
      else params.delete(key);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
    setMobileOpen(false);
  }

  function reset() {
    const cleared = {} as Record<FilterKey, string>;
    for (const key of FILTER_KEYS) cleared[key] = "";
    setDraft(cleared);
    const params = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) params.delete(key);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
    setMobileOpen(false);
  }

  const showPosition = draft.role === "player";
  const showLevel = draft.role === "player";
  const showRefereeCertified = draft.role === "referee";
  const showMedicDocument = draft.role === "medic";

  const fields = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <FilterSelect
        label={t("role")}
        placeholder={t("allRoles")}
        value={draft.role}
        onChange={(v) => setField("role", v)}
        options={APPLICATION_ROLES.map((r) => ({ value: r, label: tEnums(`role.${r}`) }))}
      />
      <FilterSelect
        label={t("district")}
        placeholder={t("allDistricts")}
        value={draft.district}
        onChange={(v) => setField("district", v)}
        options={DISTRICTS.map((d) => ({ value: d, label: tEnums(`district.${d}`) }))}
      />
      <MultiSelectFilter
        label={t("status")}
        placeholder={t("allStatuses")}
        value={draft.status}
        onChange={(v) => setField("status", v)}
        options={APPLICATION_STATUSES.map((s) => ({ value: s, label: tEnums(`status.${s}`) }))}
      />

      {showPosition && (
        <>
          <MultiSelectFilter
            label={t("position")}
            placeholder={t("position")}
            value={draft.position}
            onChange={(v) => setField("position", v)}
            options={[
              ...MAIN_POSITIONS.map((p) => ({ value: p, label: tEnums(`mainPosition.${p}`) })),
              ...MEDIC_SPECIALTIES.map((p) => ({ value: p, label: tEnums(`specialty.${p}`) })),
            ]}
          />
          <FilterSelect
            label=""
            placeholder={t("positionMode.mainAndExtra")}
            value={draft.position_mode || "main_and_extra"}
            onChange={(v) => setField("position_mode", v)}
            options={[
              { value: "main_and_extra", label: t("positionMode.mainAndExtra") },
              { value: "main_only", label: t("positionMode.mainOnly") },
            ]}
          />
        </>
      )}

      {showLevel && (
        <>
          <MultiSelectFilter
            label={t("level")}
            placeholder={t("allLevels")}
            value={draft.level}
            onChange={(v) => setField("level", v)}
            options={PLAYER_EXPERIENCE_LEVELS.map((lvl) => ({
              value: lvl,
              label: tEnums(`experienceLevel.${lvl}`),
            }))}
          />
          <FilterSelect
            label=""
            placeholder={t("levelSource.self")}
            value={draft.level_source || "self"}
            onChange={(v) => setField("level_source", v)}
            options={[
              { value: "self", label: t("levelSource.self") },
              { value: "admin", label: t("levelSource.admin") },
            ]}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {t("priceMin")}
            <Input
              type="number"
              value={draft.price_min}
              onChange={(e) => setField("price_min", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            {t("priceMax")}
            <Input
              type="number"
              value={draft.price_max}
              onChange={(e) => setField("price_max", e.target.value)}
            />
          </label>
          <FilterSelect
            label={t("isStudent")}
            placeholder={t("yesNo.all")}
            value={draft.is_student}
            onChange={(v) => setField("is_student", v)}
            options={[
              { value: "yes", label: t("yesNo.yes") },
              { value: "no", label: t("yesNo.no") },
            ]}
          />
          {draft.is_student === "yes" && (
            <>
              <UniversityFilterInput
                label={t("university")}
                value={draft.university}
                onChange={(v) => setField("university", v)}
              />
              <FilterSelect
                label={t("courseYear")}
                placeholder={t("courseYear")}
                value={draft.course_year}
                onChange={(v) => setField("course_year", v)}
                options={COURSE_YEARS.map((y) => ({ value: y, label: y }))}
              />
            </>
          )}
          <FilterSelect
            label={t("hasProExperience")}
            placeholder={t("yesNo.all")}
            value={draft.has_pro_experience}
            onChange={(v) => setField("has_pro_experience", v)}
            options={[
              { value: "yes", label: t("yesNo.yes") },
              { value: "no", label: t("yesNo.no") },
            ]}
          />
        </>
      )}

      {showRefereeCertified && (
        <FilterSelect
          label={t("refereeCertified")}
          placeholder={t("yesNo.all")}
          value={draft.referee_certified}
          onChange={(v) => setField("referee_certified", v)}
          options={[
            { value: "yes", label: t("yesNo.yes") },
            { value: "no", label: t("yesNo.no") },
          ]}
        />
      )}

      {showMedicDocument && (
        <FilterSelect
          label={t("medicHasDocument")}
          placeholder={t("yesNo.all")}
          value={draft.medic_has_document}
          onChange={(v) => setField("medic_has_document", v)}
          options={[
            { value: "yes", label: t("yesNo.yes") },
            { value: "no", label: t("yesNo.no") },
          ]}
        />
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        {t("ageMin")}
        <Input type="number" value={draft.age_min} onChange={(e) => setField("age_min", e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        {t("ageMax")}
        <Input type="number" value={draft.age_max} onChange={(e) => setField("age_max", e.target.value)} />
      </label>

      <FilterSelect
        label={t("hasVideo")}
        placeholder={t("yesNo.all")}
        value={draft.has_video}
        onChange={(v) => setField("has_video", v)}
        options={[
          { value: "yes", label: t("yesNo.yes") },
          { value: "no", label: t("yesNo.no") },
        ]}
      />

      <FilterSelect
        label={t("adminRatingMin")}
        placeholder={t("adminRatingMin")}
        value={draft.admin_rating_min}
        onChange={(v) => setField("admin_rating_min", v)}
        options={["1", "2", "3", "4", "5"].map((n) => ({ value: n, label: `${n}+` }))}
      />

      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        {t("dateFrom")}
        <Input
          type="date"
          value={draft.date_from}
          onChange={(e) => setField("date_from", e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        {t("dateTo")}
        <Input type="date" value={draft.date_to} onChange={(e) => setField("date_to", e.target.value)} />
      </label>

      <div className="col-span-full flex gap-2 pt-1">
        <Button type="button" size="sm" onClick={apply}>
          {t("apply")}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={reset}>
          {t("reset")}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden rounded-xl border border-brand-dark/10 bg-white p-4 md:block">{fields}</div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        {t("openMobile")}
      </Button>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="fixed inset-x-0 bottom-0 left-0 top-auto max-h-[85vh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-b-none rounded-t-2xl md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">{t("title")}</h2>
            <button type="button" onClick={() => setMobileOpen(false)} aria-label={t("close")}>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {fields}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FilterSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
      {label}
      <Select value={value || "__all__"} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
