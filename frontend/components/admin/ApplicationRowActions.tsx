"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  updateApplicationStatus,
  restoreApplication,
  deleteApplication,
  type ApplicationTab,
} from "@/lib/api/admin/applications";

const LIST_QUERY_KEY = ["admin-applications"];
const COUNTS_QUERY_KEY = ["admin-application-counts"];

/**
 * The two icon actions on every list row, varying by which tab they're
 * shown in (spec section 3B): Pending = accept/delete, Accepted = return-
 * to-pending/delete, Deleted = restore/permanent-delete. Both the "Sil"
 * (soft delete) and accept actions show a 5s undo toast; permanent
 * delete gets its own, more serious confirm dialog.
 */
export function ApplicationRowActions({
  applicationId,
  applicationName,
  tab,
}: {
  applicationId: string;
  applicationName: string;
  tab: ApplicationTab;
}) {
  const t = useTranslations("admin.applications.rowActions");
  const tc = useTranslations("admin.common");
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);

  function invalidateLists() {
    queryClient.invalidateQueries({ queryKey: LIST_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: COUNTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
  }

  const acceptMutation = useMutation({
    mutationFn: () => updateApplicationStatus(applicationId, "accepted"),
    onSuccess: () => {
      invalidateLists();
      toast.success(t("acceptedToast"), {
        duration: 5000,
        action: { label: t("undo"), onClick: () => undoMutation.mutate() },
      });
    },
    onError: () => toast.error(t("error")),
  });

  const undoMutation = useMutation({
    mutationFn: () => restoreApplication(applicationId),
    onSuccess: invalidateLists,
    onError: () => toast.error(t("error")),
  });

  const softDeleteMutation = useMutation({
    mutationFn: () => updateApplicationStatus(applicationId, "rejected"),
    onSuccess: () => {
      invalidateLists();
      setDeleteDialogOpen(false);
      toast.success(t("deletedToast"), {
        duration: 5000,
        action: { label: t("undo"), onClick: () => undoMutation.mutate() },
      });
    },
    onError: () => toast.error(t("error")),
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreApplication(applicationId),
    onSuccess: () => {
      invalidateLists();
      toast.success(t("restoredToast"));
    },
    onError: () => toast.error(t("error")),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: () => deleteApplication(applicationId),
    onSuccess: () => {
      invalidateLists();
      setPermanentDeleteDialogOpen(false);
      toast.success(t("permanentDeletedToast"));
    },
    onError: () => toast.error(t("error")),
  });

  const iconButtonClass = "flex h-11 w-11 items-center justify-center rounded-lg border";

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {tab === "pending" && (
        <button
          type="button"
          title={t("accept")}
          aria-label={t("accept")}
          disabled={acceptMutation.isPending}
          onClick={() => acceptMutation.mutate()}
          className={`${iconButtonClass} border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-50`}
        >
          <Check className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {(tab === "accepted" || tab === "deleted") && (
        <button
          type="button"
          title={tab === "accepted" ? t("returnToPending") : t("restore")}
          aria-label={tab === "accepted" ? t("returnToPending") : t("restore")}
          disabled={restoreMutation.isPending}
          onClick={() => restoreMutation.mutate()}
          className={`${iconButtonClass} border-brand-dark/15 text-foreground hover:bg-brand-dark/5 disabled:opacity-50`}
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {tab !== "deleted" && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <button
            type="button"
            title={t("delete")}
            aria-label={t("delete")}
            onClick={() => setDeleteDialogOpen(true)}
            className={`${iconButtonClass} border-red-200 text-red-600 hover:bg-red-50`}
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("deleteConfirmTitle", { name: applicationName })}</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("deleteCancel")}
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={() => softDeleteMutation.mutate()}
                disabled={softDeleteMutation.isPending}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {t("deleteConfirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {tab === "deleted" && (
        <Dialog open={permanentDeleteDialogOpen} onOpenChange={setPermanentDeleteDialogOpen}>
          <button
            type="button"
            title={t("permanentDelete")}
            aria-label={t("permanentDelete")}
            onClick={() => setPermanentDeleteDialogOpen(true)}
            className={`${iconButtonClass} border-red-200 text-red-600 hover:bg-red-50`}
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("permanentDeleteConfirmTitle", { name: applicationName })}
              </DialogTitle>
              <DialogDescription className="text-red-600">
                {t("permanentDeleteWarning")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {tc("cancel")}
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={() => permanentDeleteMutation.mutate()}
                disabled={permanentDeleteMutation.isPending}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {t("permanentDeleteConfirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
