import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";

/**
 * Site-wide minimal legal footer shown on every marketing page (home,
 * /qeydiyyat, /mexfilik). The rich contact block (phone/WhatsApp/
 * Instagram/TikTok, also with its own copyright line per spec) lives
 * only on the home page as `components/home/ElaqeFooterSection.tsx` —
 * this component intentionally stays settings-free and minimal so the
 * two don't visually duplicate on `/`.
 */
export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-dark/10 bg-surface">
      <Container className="flex flex-col items-center gap-3 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <Link href="/" className="text-lg font-bold lowercase tracking-tight">
          futbolio
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/mexfilik" className="hover:text-foreground">
            {t("privacyLink")}
          </Link>
        </nav>
        <p className="text-sm text-muted-2">{t("copyright", { year })}</p>
      </Container>
    </footer>
  );
}
