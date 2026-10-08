"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUSES } from "@/lib/admin/enums";
import { updateApplicationStatus, type ApplicationStatus } from "@/lib/api/admin/applications";

export function ApplicationStatusControl({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const t = useTranslations("admin.applicationDetail.status");
  const tEnums = useTranslations("admin.enums");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (next: ApplicationStatus) => updateApplicationStatus(applicationId, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      toast.success(t("updateSuccess"));
    },
    onError: () => {
      toast.error(t("updateError"));
    },
  });

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
      {t("label")}
      <Select
        value={status}
        onValueChange={(value) => mutation.mutate(value as ApplicationStatus)}
        disabled={mutation.isPending}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {APPLICATION_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {tEnums(`status.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
