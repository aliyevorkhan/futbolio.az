import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";

/**
 * "Komandamıza qoşul" CTA block — a CONTAINED rounded block with visible
 * white margin (the section itself stays white; the green block is the
 * inner div), not full-bleed. Per the project's contrast rule, text on
 * `bg-brand-green` always uses `text-brand-dark`, never `text-white`.
 */
export async function QosulCtaSection() {
  const t = await getTranslations("home.cta");

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <div className="flex flex-col items-center gap-6 rounded-2xl bg-brand-green px-6 py-14 text-center text-brand-dark sm:flex-row sm:justify-between sm:px-10 sm:text-left">
          <p className="font-heading text-2xl font-bold sm:text-3xl">{t("heading")}</p>

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <Button asChild variant="dark-solid" size="lg">
              <Link href="/qeydiyyat">
                {t("button")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <p className="text-sm text-brand-dark/70">{t("text")}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
