"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import { updateApplicationPhone } from "@/lib/api/admin/applications";

/**
 * The one way to resolve a real conflict the "Dublikat nömrələr" report
 * surfaces — nothing is ever deleted/merged automatically. Reused from
 * both the duplicate-phones list and (if wired there later) the
 * candidate detail page, so there's one place this flow lives.
 */
export function EditPhoneDialog({
  applicationId,
  currentPhone,
  onSuccess,
}: {
  applicationId: string;
  currentPhone: string;
  onSuccess?: () => void;
}) {
  const t = useTranslations("admin.applicationDetail.editPhone");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(currentPhone);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateApplicationPhone(applicationId, phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-application-audit-log", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-duplicate-phones"] });
      toast.success(t("success"));
      setOpen(false);
      setFieldError(null);
      onSuccess?.();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors.phone?.[0]) {
        setFieldError(error.fieldErrors.phone[0]);
      } else {
        toast.error(t("error"));
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setPhone(currentPhone);
          setFieldError(null);
        }
      }}
    >
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
        {t("trigger")}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="edit-phone-input">{t("label")}</Label>
          <Input
            id="edit-phone-input"
            value={phone}
            aria-invalid={Boolean(fieldError)}
            onChange={(event) => {
              setPhone(event.target.value);
              setFieldError(null);
            }}
          />
          {fieldError ? <p className="mt-1.5 text-sm text-red-600">{fieldError}</p> : null}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
