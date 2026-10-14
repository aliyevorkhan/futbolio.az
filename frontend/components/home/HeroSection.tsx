"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { useRoleOptions } from "@/lib/hooks/useRoleOptions";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { HeroIllustration } from "@/components/home/HeroIllustration";
import { RoleMenu } from "@/components/home/RoleMenu";

const CHECKLIST_KEYS = [
  "checklistPlayers",
  "checklistGoalkeepers",
  "checklistReferees",
  "checklistMedics",
] as const;

/**
 * Hero section (`#top`). "Oyunçu tap" no longer links straight to
 * WhatsApp with a generic message — it (and the pitch's "?" slot) opens
 * a role picker, each option carrying its own WhatsApp message. Client
 * component for that menu state and for `useSettingsQuery()`'s
 * WhatsApp number (same source every WhatsApp link on the site uses).
 */
export function HeroSection() {
  const t = useTranslations("home.hero");
  const { data: settings } = useSettingsQuery();
  const roles = useRoleOptions();

  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const openMenu = (rect: DOMRect) => {
    setAnchorRect(rect);
    setMenuOpen(true);
  };

  return (
    <section id="top" className="bg-surface">
      <Container className="pb-[120px] pt-7 lg:grid lg:min-h-[calc(100vh-80px)] lg:grid-cols-2 lg:items-center lg:gap-[72px] lg:py-[90px] lg:pb-[110px]">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-mint px-3.5 py-[7px] text-xs font-semibold text-foreground lg:px-4 lg:text-sm">
            {t("badge")}
          </span>

          <h1 className="mt-4 font-heading text-[38px] font-bold leading-[1.08] tracking-[-2px] lg:mt-[22px] lg:text-[56px] lg:tracking-[-2px]">
            {t("titleLine1")}
            <br />
            <span className="mt-1.5 inline-block rounded-lg bg-brand-green px-[0.14em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
              {t("titleLine2")}
            </span>
          </h1>

          <p className="mt-3.5 text-[15px] leading-[1.6] text-muted lg:mt-5 lg:max-w-[520px] lg:text-lg">{t("subtitle")}</p>

          <ul className="mt-[18px] flex flex-wrap gap-x-[18px] gap-y-2.5 text-sm font-medium text-foreground lg:mt-[26px] lg:gap-x-[26px] lg:gap-y-3 lg:text-base">
            {CHECKLIST_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-[7px]">
                <Check className="h-4 w-4 text-[#00B35C]" aria-hidden="true" />
                {t(key)}
              </li>
            ))}
          </ul>

          <div className="mt-[34px] hidden gap-3.5 lg:flex">
            <Button
              variant="default"
              size="lg"
              className="h-[52px] px-[30px] text-base font-bold"
              onClick={(event) => openMenu(event.currentTarget.getBoundingClientRect())}
            >
              {t("findPlayerCta")}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-[52px] rounded-full px-[30px] text-base">
              <Link href="/qeydiyyat">{t("joinCta")}</Link>
            </Button>
          </div>
        </div>

        <HeroIllustration onOpenRoleMenu={openMenu} />

        <Link
          href="/qeydiyyat"
          className="mt-3.5 flex h-[52px] items-center justify-center rounded-full border-[1.5px] border-[#C9D0CC] text-base font-semibold text-foreground lg:hidden"
        >
          {t("joinCta")}
        </Link>
      </Container>

      {/* Mobile-only fixed "find a player" CTA — desktop uses the inline button above. */}
      <button
        type="button"
        onClick={(event) => openMenu(event.currentTarget.getBoundingClientRect())}
        className="fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-[8] flex h-[52px] items-center justify-center gap-2.5 rounded-full bg-brand-green text-base font-bold text-brand-dark shadow-[0_10px_30px_rgba(10,20,16,0.2)] lg:hidden"
      >
        <MessageCircle className="h-5 w-5 fill-brand-dark text-brand-dark" aria-hidden="true" />
        {t("findPlayerCta")}
      </button>

      <RoleMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRect={anchorRect}
        roles={roles}
        title={t("roleMenuTitle")}
        whatsappNumber={settings?.whatsapp_number}
        analyticsPrefix="hero_role_menu"
      />
    </section>
  );
}
