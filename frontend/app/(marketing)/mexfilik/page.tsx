import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";

export async function generateMetadata() {
  const t = await getTranslations("meta.mexfilik");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function MexfilikPage() {
  const t = await getTranslations("privacy");

  const sections = [
    { title: t("dataTitle"), body: t("dataBody") },
    { title: t("purposeTitle"), body: t("purposeBody") },
    { title: t("retentionTitle"), body: t("retentionBody") },
    { title: t("sharingTitle"), body: t("sharingBody") },
    { title: t("deletionTitle"), body: t("deletionBody") },
  ];

  return (
    <Container className="max-w-3xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-4 text-muted">{t("intro")}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-muted">{section.body}</p>
          </section>
        ))}
      </div>
    </Container>
  );
}
