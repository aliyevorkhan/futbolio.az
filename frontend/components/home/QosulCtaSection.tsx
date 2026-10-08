import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";

/**
 * Full-width "Komandamıza qoşul" CTA block. Per the project's contrast
 * rule, text on `bg-brand-green` always uses `text-brand-dark`, never
 * `text-white`.
 */
export async function QosulCtaSection() {
  const t = await getTranslations("home.cta");

  return (
    <section className="bg-brand-green text-brand-dark">
      <Container className="flex flex-col items-center justify-between gap-6 py-14 text-center sm:flex-row sm:text-left">
        <p className="text-lg font-semibold">{t("text")}</p>
        <Link
          href="/qeydiyyat"
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-brand-dark px-7 text-sm font-semibold text-white transition-colors hover:bg-brand-dark/90"
        >
          {t("button")}
        </Link>
      </Container>
    </section>
  );
}
