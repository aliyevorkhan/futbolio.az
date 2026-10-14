"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationsFilters } from "@/components/admin/ApplicationsFilters";
import { ApplicationsTable } from "@/components/admin/ApplicationsTable";
import { ApplicationsCardList } from "@/components/admin/ApplicationsCardList";
import { ExportApplicationsButton } from "@/components/admin/ExportApplicationsButton";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { Button } from "@/components/ui/button";
import {
  listApplications,
  getApplicationCounts,
  type ApplicationListParams,
  type ApplicationTab,
} from "@/lib/api/admin/applications";

const TABS: ApplicationTab[] = ["pending", "accepted", "deleted"];

const FILTER_PARAM_KEYS = [
  "role",
  "district",
  "status",
  "date_from",
  "date_to",
  "level",
  "position",
  "search",
  "ordering",
  "page",
] as const;

function buildParams(searchParams: URLSearchParams): ApplicationListParams {
  const params: ApplicationListParams = {};
  for (const key of FILTER_PARAM_KEYS) {
    const value = searchParams.get(key);
    if (!value) continue;
    if (key === "page") params.page = Number(value);
    else (params as Record<string, string>)[key] = value;
  }
  const tabParam = searchParams.get("tab");
  params.tab = (TABS as string[]).includes(tabParam ?? "") ? (tabParam as ApplicationTab) : "pending";
  return params;
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationsPageContent />
    </Suspense>
  );
}

function ApplicationsPageContent() {
  const t = useTranslations("admin.applications");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") ?? "");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const params = buildParams(searchParams);
  const tab = params.tab ?? "pending";

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ["admin-applications", params],
    queryFn: () => listApplications(params),
    placeholderData: keepPreviousData,
  });

  const { role, district, status, date_from, date_to, level, position, search } = params;
  const { data: counts } = useQuery({
    queryKey: ["admin-application-counts", { role, district, status, date_from, date_to, level, position, search }],
    queryFn: () =>
      getApplicationCounts({ role, district, status, date_from, date_to, level, position, search }),
  });

  // Selection never carries across a tab switch, a page change, or a
  // filter change — stale ids from a different result set would silently
  // no-op against the bulk-status endpoint.
  useEffect(() => {
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  }

  function goToPage(page: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(page));
    router.replace(`${pathname}?${next.toString()}`);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(data?.results.map((a) => a.id) ?? []) : new Set());
  }

  const page = params.page ?? 1;
  const pageSize = 20;
  const count = data?.count ?? 0;
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <ExportApplicationsButton filters={params} />
      </div>

      <Tabs value={tab} onValueChange={(value) => updateParam("tab", value)}>
        <TabsList>
          {TABS.map((tabValue) => (
            <TabsTrigger key={tabValue} value={tabValue}>
              {t(`tabs.${tabValue}`)} ({counts?.[tabValue] ?? "…"})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ApplicationsFilters />

      <div className="flex flex-wrap items-center gap-3">
        <form
          className="flex max-w-sm flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateParam("search", searchDraft);
          }}
        >
          <Input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={t("searchPlaceholder")}
          />
          <Button type="submit" size="sm" variant="outline">
            <Search className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>

        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          {t("sort.label")}
          <Select
            value={searchParams.get("ordering") ?? "-created_at"}
            onValueChange={(v) => updateParam("ordering", v)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created_at">{t("sort.newest")}</SelectItem>
              <SelectItem value="created_at">{t("sort.oldest")}</SelectItem>
              <SelectItem value="full_name">{t("sort.nameAsc")}</SelectItem>
              <SelectItem value="status">{t("sort.statusAsc")}</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>

      <BulkActionBar selectedIds={[...selectedIds]} onDone={() => setSelectedIds(new Set())} />

      {isLoading && <p className="text-sm text-muted">{tc("loading")}</p>}
      {isError && <p className="text-sm text-red-600">{t("loadError")}</p>}

      {data && data.results.length === 0 && (
        <p className="rounded-xl border border-brand-dark/10 bg-white p-6 text-center text-sm text-muted">
          {t("empty")}
        </p>
      )}

      {data && data.results.length > 0 && (
        <div className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
          <ApplicationsTable
            applications={data.results}
            tab={tab}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />
          <ApplicationsCardList
            applications={data.results}
            tab={tab}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        </div>
      )}

      {data && count > 0 && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted">
          <span>{t("pagination.pageInfo", { count, from, to })}</span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!data.previous}
              onClick={() => goToPage(page - 1)}
            >
              {t("pagination.previous")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!data.next}
              onClick={() => goToPage(page + 1)}
            >
              {t("pagination.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
