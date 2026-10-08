import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/shared/Container";
import { MobileNavScroller } from "@/components/layout/MobileNavScroller";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
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
 * globals.css. True 3-slot centered layout (logo | centered nav | CTA),
 * not `justify-between`, so the nav stays visually centered regardless
 * of how wide the logo/CTA cluster is. Mobile nav is an explicit spec
 * requirement: a horizontally-scrollable row of pill buttons, NOT a
 * hamburger menu.
 */
export async function Header() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-brand-dark/10 bg-white/90 backdrop-blur">
      <Container className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link href="/" className="shrink-0 text-xl font-bold lowercase tracking-tight">
          futbolio
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center justify-center gap-6 sm:flex"
          aria-label={t("primaryNavigation")}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3 justify-self-end">
          <LanguageSwitcher className="hidden sm:flex" />
          <Button asChild variant="dark-solid" size="sm" className="hidden sm:inline-flex">
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
                className="shrink-0 rounded-full border border-brand-dark/10 px-4 py-1.5 text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
              >
                {t(link.key)}
              </a>
            ))}
            <Link
              href="/qeydiyyat"
              className="shrink-0 rounded-full bg-brand-dark px-4 py-1.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-dark/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
            >
              {t("cta")}
            </Link>
            <LanguageSwitcher className="shrink-0" />
          </MobileNavScroller>
        </Container>
      </div>
    </header>
  );
}
