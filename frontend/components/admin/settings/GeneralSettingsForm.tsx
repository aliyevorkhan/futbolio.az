"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminSettings, updateAdminSettings, type AdminSettings } from "@/lib/api/admin/settings";

const FIELDS: { key: keyof AdminSettings; labelKey: string }[] = [
  { key: "whatsapp_number", labelKey: "whatsappNumber" },
  { key: "whatsapp_default_text", labelKey: "whatsappDefaultText" },
  { key: "phone_number", labelKey: "phoneNumber" },
  { key: "instagram_url", labelKey: "instagramUrl" },
  { key: "instagram_dm_url", labelKey: "instagramDmUrl" },
  { key: "tiktok_url", labelKey: "tiktokUrl" },
];

export function GeneralSettingsForm() {
  const t = useTranslations("admin.settings.general");
  const tc = useTranslations("admin.common");
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: getAdminSettings,
  });

  const [form, setForm] = useState<AdminSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: AdminSettings) => updateAdminSettings(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin-settings"], updated);
      toast.success(t("saveSuccess"));
    },
    onError: () => {
      toast.error(t("saveError"));
    },
  });

  if (isLoading || !form) {
    return <p className="text-sm text-muted">{tc("loading")}</p>;
  }

  return (
    <form
      className="flex max-w-xl flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(form);
      }}
    >
      {FIELDS.map(({ key, labelKey }) => (
        <label key={key} className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
          {t(labelKey)}
          <Input
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </label>
      ))}
      <Button type="submit" disabled={mutation.isPending} className="self-start">
        {mutation.isPending ? tc("saving") : t("save")}
      </Button>
    </form>
  );
}
