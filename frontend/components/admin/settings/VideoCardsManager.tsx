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
  listVideoCards,
  createVideoCard,
  updateVideoCard,
  deleteVideoCard,
  type VideoCard,
  type VideoCardPayload,
} from "@/lib/api/admin/settings";

const EMPTY_FORM: VideoCardPayload = {
  link: "",
  cover_image_key: "",
  caption: "",
  order: 0,
  is_active: true,
};

export function VideoCardsManager() {
  const t = useTranslations("admin.settings.videoCards");
  const tc = useTranslations("admin.common");
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-video-cards"], queryFn: listVideoCards });

  const [editing, setEditing] = useState<VideoCard | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<VideoCardPayload>(EMPTY_FORM);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
  }

  function openEdit(card: VideoCard) {
    setForm(card);
    setEditing(card);
  }

  function closeDialogs() {
    setCreating(false);
    setEditing(null);
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-video-cards"] });

  const createMutation = useMutation({
    mutationFn: () => createVideoCard(form),
    onSuccess: () => {
      invalidate();
      toast.success(t("createSuccess"));
      closeDialogs();
    },
    onError: () => toast.error(t("error")),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateVideoCard(editing!.id, form),
    onSuccess: () => {
      invalidate();
      toast.success(t("updateSuccess"));
      closeDialogs();
    },
    onError: () => toast.error(t("error")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVideoCard(id),
    onSuccess: () => {
      invalidate();
      toast.success(t("deleteSuccess"));
    },
    onError: () => toast.error(t("error")),
  });

  const cards = data?.results ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" size="sm" className="self-start" onClick={openCreate}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("addTitle")}
      </Button>

      {isLoading && <p className="text-sm text-muted">{tc("loading")}</p>}
      {!isLoading && cards.length === 0 && <p className="text-sm text-muted">{t("empty")}</p>}

      <ul className="flex flex-col gap-2">
        {cards.map((card) => (
          <li
            key={card.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-brand-dark/10 p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{card.caption || card.link}</p>
              <p className="truncate text-xs text-muted">{card.link}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!card.is_active && (
                <span className="text-xs text-muted">({tc("inactive")})</span>
              )}
              <Button type="button" size="sm" variant="outline" onClick={() => openEdit(card)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={() => deleteMutation.mutate(card.id)}
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
              {t("link")}
              <Input
                required
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {t("coverImageKey")}
              <Input
                value={form.cover_image_key}
                onChange={(e) => setForm({ ...form, cover_image_key: e.target.value })}
              />
              <span className="text-xs text-muted">{t("coverImageHint")}</span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              {t("caption")}
              <Input
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
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
