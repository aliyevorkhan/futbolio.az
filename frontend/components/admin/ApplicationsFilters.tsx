"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APPLICATION_ROLES,
  APPLICATION_STATUSES,
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
  "position",
] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

export function ApplicationsFilters() {
  const t = useTranslations("admin.applications.filters");
  const tEnums = useTranslations("admin.enums");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      if (draft[key]) params.set(key, draft[key]);
      else params.delete(key);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function reset() {
    const cleared = {} as Record<FilterKey, string>;
    for (const key of FILTER_KEYS) cleared[key] = "";
    setDraft(cleared);
    const params = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) params.delete(key);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-brand-dark/10 bg-white p-4 sm:grid-cols-3 lg:grid-cols-5">
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
      <FilterSelect
        label={t("status")}
        placeholder={t("allStatuses")}
        value={draft.status}
        onChange={(v) => setField("status", v)}
        options={APPLICATION_STATUSES.map((s) => ({ value: s, label: tEnums(`status.${s}`) }))}
      />
      <FilterSelect
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
        label={t("level")}
        placeholder={t("allLevels")}
        value={draft.level}
        onChange={(v) => setField("level", v)}
        options={PLAYER_EXPERIENCE_LEVELS.map((lvl) => ({
          value: lvl,
          label: tEnums(`experienceLevel.${lvl}`),
        }))}
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
        <Input
          type="date"
          value={draft.date_to}
          onChange={(e) => setField("date_to", e.target.value)}
        />
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
