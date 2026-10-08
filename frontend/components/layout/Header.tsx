import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { MobileNavScroller } from "@/components/layout/MobileNavScroller";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#biz", key: "biz" },
  { href: "#xidmetler", key: "xidmetler" },
  { href: "#nece", key: "nece" },
  { href: "#suallar", key: "suallar" },
] as const;

/**
 * Sticky site header. Server component — no client-side state needed:
 * anchor smooth-scrolling comes from `scroll-behavior: smooth` in
 * globals.css. Mobile nav is an explicit spec requirement: a
 * horizontally-scrollable row of pill buttons, NOT a hamburger menu.
 */
export async function Header() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-brand-dark/10 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0 text-xl font-bold lowercase tracking-tight">
          futbolio
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex" aria-label={t("primaryNavigation")}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 sm:block">
          <Button asChild size="sm">
            <Link href="/qeydiyyat">{t("cta")}</Link>
          </Button>
        </div>
      </Container>

      {/* Mobile nav: horizontally-scrollable pills, not a dropdown */}
      <div className="border-t border-brand-dark/5 sm:hidden">
        <Container className="py-2">
          <MobileNavScroller>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="shrink-0 rounded-full border border-brand-dark/10 px-4 py-1.5 text-sm font-medium text-muted"
              >
                {t(link.key)}
              </a>
            ))}
            <Link
              href="/qeydiyyat"
              className="shrink-0 rounded-full bg-brand-green px-4 py-1.5 text-sm font-semibold text-brand-dark"
            >
              {t("cta")}
            </Link>
          </MobileNavScroller>
        </Container>
      </div>
    </header>
  );
}
