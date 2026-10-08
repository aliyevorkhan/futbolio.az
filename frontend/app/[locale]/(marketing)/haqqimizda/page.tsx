import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";

export async function generateMetadata() {
  const t = await getTranslations("meta.about");
  return {
    title: t("title"),
    description: t("description"),
  };
}

/**
 * About page (`/haqqimizda`). A standalone route rather than a home
 * anchor section — the replacement copy is 4 full paragraphs, too long
 * for the home page's short `#biz` blurb. Linked from the footer's
 * bottom-bar link cluster (not the header nav, to avoid crowding the
 * now-centered nav).
 */
export default async function AboutPage() {
  const t = await getTranslations("about");

  const paragraphs = [t("paragraph1"), t("paragraph2"), t("paragraph3"), t("paragraph4")];

  return (
    <Container className="max-w-3xl py-16 sm:py-24">
      <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        {t("title")}
      </h1>

      <div className="mt-8 space-y-5">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-base leading-[1.5] text-muted">
            {paragraph}
          </p>
        ))}
      </div>
    </Container>
  );
}
