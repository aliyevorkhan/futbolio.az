"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { bulkUpdateApplicationStatus } from "@/lib/api/admin/applications";

/**
 * Sticky bar shown once 1+ rows are selected (spec section 3C) —
 * "{n} seçildi · Qəbul et · Sil", bulk delete also confirmed via a
 * dialog like the single-row action.
 */
export function BulkActionBar({
  selectedIds,
  onDone,
}: {
  selectedIds: string[];
  onDone: () => void;
}) {
  const t = useTranslations("admin.applications.bulk");
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  function invalidateLists() {
    queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    queryClient.invalidateQueries({ queryKey: ["admin-application-counts"] });
  }

  const acceptMutation = useMutation({
    mutationFn: () => bulkUpdateApplicationStatus(selectedIds, "accepted"),
    onSuccess: () => {
      invalidateLists();
      toast.success(t("acceptedToast", { count: selectedIds.length }));
      onDone();
    },
    onError: () => toast.error(t("error")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => bulkUpdateApplicationStatus(selectedIds, "rejected"),
    onSuccess: () => {
      invalidateLists();
      setDeleteDialogOpen(false);
      toast.success(t("deletedToast", { count: selectedIds.length }));
      onDone();
    },
    onError: () => toast.error(t("error")),
  });

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-brand-dark/15 bg-white px-4 py-3 shadow-sm">
      <span className="text-sm font-semibold text-foreground">
        {t("selectedCount", { count: selectedIds.length })}
      </span>
      <Button
        type="button"
        size="sm"
        onClick={() => acceptMutation.mutate()}
        disabled={acceptMutation.isPending}
      >
        {t("accept")}
      </Button>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-red-600 hover:bg-red-50"
          onClick={() => setDeleteDialogOpen(true)}
        >
          {t("delete")}
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle", { count: selectedIds.length })}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {t("deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
