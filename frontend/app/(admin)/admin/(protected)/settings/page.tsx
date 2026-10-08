"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettingsForm } from "@/components/admin/settings/GeneralSettingsForm";
import { VideoCardsManager } from "@/components/admin/settings/VideoCardsManager";
import { FaqManager } from "@/components/admin/settings/FaqManager";

export default function SettingsPage() {
  const t = useTranslations("admin.settings");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t("tabs.general")}</TabsTrigger>
          <TabsTrigger value="videoCards">{t("tabs.videoCards")}</TabsTrigger>
          <TabsTrigger value="faq">{t("tabs.faq")}</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralSettingsForm />
        </TabsContent>
        <TabsContent value="videoCards">
          <VideoCardsManager />
        </TabsContent>
        <TabsContent value="faq">
          <FaqManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
