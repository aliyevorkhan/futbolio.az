"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addApplicationNote, type AdminNote } from "@/lib/api/admin/applications";

export function ApplicationNotes({
  applicationId,
  notes,
}: {
  applicationId: string;
  notes: AdminNote[];
}) {
  const t = useTranslations("admin.applicationDetail.notes");
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const mutation = useMutation({
    mutationFn: (noteText: string) => addApplicationNote(applicationId, noteText),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
    },
    onError: () => {
      toast.error(t("addError"));
    },
  });

  const sorted = [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) mutation.mutate(text.trim());
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
        />
        <Button type="submit" size="sm" disabled={mutation.isPending || !text.trim()}>
          {mutation.isPending ? t("adding") : t("add")}
        </Button>
      </form>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((note) => (
            <li key={note.id} className="rounded-lg border border-brand-dark/10 p-3 text-sm">
              <p className="text-foreground">{note.text}</p>
              <p className="mt-1 text-xs text-muted">
                {note.admin_email} · {format(new Date(note.created_at), "dd.MM.yyyy HH:mm")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
