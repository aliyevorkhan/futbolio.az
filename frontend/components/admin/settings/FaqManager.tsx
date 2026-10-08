"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  listFaq,
  createFaq,
  updateFaq,
  deleteFaq,
  type FaqItem,
  type FaqItemPayload,
} from "@/lib/api/admin/settings";

const EMPTY_FORM: FaqItemPayload = {
  question: "",
  answer: "",
  order: 0,
  is_active: true,
};

export function FaqManager() {
  const t = useTranslations("admin.settings.faq");
  const tc = useTranslations("admin.common");
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-faq"], queryFn: listFaq });

  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FaqItemPayload>(EMPTY_FORM);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
  }

  function openEdit(item: FaqItem) {
    setForm(item);
    setEditing(item);
  }

  function closeDialogs() {
    setCreating(false);
    setEditing(null);
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-faq"] });

  const createMutation = useMutation({
    mutationFn: () => createFaq(form),
    onSuccess: () => {
      invalidate();
      toast.success(t("createSuccess"));
      closeDialogs();
    },
    onError: () => toast.error(t("error")),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateFaq(editing!.id, form),
    onSuccess: () => {
      invalidate();
      toast.success(t("updateSuccess"));
      closeDialogs();
    },
    onError: () => toast.error(t("error")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFaq(id),
    onSuccess: () => {
      invalidate();
      toast.success(t("deleteSuccess"));
    },
    onError: () => toast.error(t("error")),
  });

  const items = data?.results ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" size="sm" className="self-start" onClick={openCreate}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("addTitle")}
      </Button>

      {isLoading && <p className="text-sm text-muted">{tc("loading")}</p>}
      {!isLoading && items.length === 0 && <p className="text-sm text-muted">{t("empty")}</p>}

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-brand-dark/10 p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{item.question}</p>
              <p className="truncate text-xs text-muted">{item.answer}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!item.is_active && <span className="text-xs text-muted">({tc("inactive")})</span>}
              <Button type="button" size="sm" variant="outline" onClick={() => openEdit(item)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={() => deleteMutation.mutate(item.id)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (!open) closeDialogs();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("editTitle") : t("addTitle")}</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (editing) updateMutation.mutate();
              else createMutation.mutate();
            }}
          >
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {t("question")}
              <Input
                required
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {t("answer")}
              <textarea
                required
                rows={4}
                className="flex w-full rounded-lg border border-brand-dark/20 bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {t("order")}
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Checkbox
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked === true })}
              />
              {t("isActive")}
            </label>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {tc("cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {tc("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
