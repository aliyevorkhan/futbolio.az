import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";

export async function generateMetadata() {
  const t = await getTranslations("meta.notFound");
  return { title: t("title") };
}

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="max-w-md text-muted">{t("description")}</p>
      <Button asChild>
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </Container>
  );
}
