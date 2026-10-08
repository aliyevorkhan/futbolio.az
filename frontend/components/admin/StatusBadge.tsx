import { useTranslations } from "next-intl";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/api/admin/applications";

const STATUS_VARIANT: Record<ApplicationStatus, BadgeProps["variant"]> = {
  new: "blue",
  reviewed: "gray",
  contacted: "amber",
  accepted: "green",
  rejected: "red",
  archived: "gray",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const t = useTranslations("admin.enums");
  return <Badge variant={STATUS_VARIANT[status]}>{t(`status.${status}`)}</Badge>;
}
