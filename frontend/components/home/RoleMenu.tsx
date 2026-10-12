"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { buildWhatsAppUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { RoleIcon } from "@/components/shared/RoleIcon";
import type { RoleOption } from "@/lib/hooks/useRoleOptions";

interface RoleMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  roles: RoleOption[];
  title: string;
  whatsappNumber: string | undefined;
  analyticsPrefix: string;
}

/**
 * The "Kim lazımdır?" role picker opened from the hero's "?" slot /
 * "Oyunçu tap" buttons. Desktop: a small popover anchored next to
 * whichever trigger was clicked. Mobile: a bottom sheet, dismissible by
 * backdrop click, swipe-down, or Escape.
 */
export function RoleMenu({ open, onClose, anchorRect, roles, title, whatsappNumber, analyticsPrefix }: RoleMenuProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const firstRoleRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (open) firstRoleRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width:1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  let popoverStyle: React.CSSProperties | undefined;
  if (isDesktop && anchorRect) {
    const popoverWidth = 320;
    let left = anchorRect.right + 14;
    let top = anchorRect.top + anchorRect.height / 2 - 160;
    if (left + popoverWidth > window.innerWidth) left = anchorRect.left - popoverWidth - 14;
    left = Math.max(16, left);
    top = Math.max(16, Math.min(top, window.innerHeight - 350));
    popoverStyle = { left, top };
  }

  return (
    <>
      <div
        className={cn("fixed inset-0 z-20", isDesktop ? "bg-transparent" : "bg-brand-dark/40")}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={popoverStyle}
        className={cn(
          "fixed z-30 bg-white shadow-2xl",
          isDesktop
            ? "w-80 animate-role-menu-pop rounded-2xl p-3.5"
            : "inset-x-0 bottom-0 animate-role-menu-sheet rounded-t-3xl p-4 pb-[calc(20px+env(safe-area-inset-bottom))]",
        )}
        onTouchStart={(event) => {
          touchStartY.current = event.touches[0].clientY;
        }}
        onTouchMove={(event) => {
          if (touchStartY.current !== null && event.touches[0].clientY - touchStartY.current > 60) {
            onClose();
            touchStartY.current = null;
          }
        }}
      >
        {!isDesktop ? <div className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-[#D5DAD7]" /> : null}
        <h2 className="mb-2.5 ml-1 text-lg font-bold text-foreground">{title}</h2>
        <div>
          {roles.map((role, index) => {
            const url = whatsappNumber ? buildWhatsAppUrl(whatsappNumber, role.message) : undefined;
            return (
              <a
                key={role.key}
                ref={index === 0 ? firstRoleRef : undefined}
                target="_blank"
                rel="noopener"
                href={url}
                onClick={() => track("external_link_click", { href: url, label: `${analyticsPrefix}_${role.key}` })}
                className="group flex min-h-14 items-center gap-3.5 rounded-2xl px-2.5 py-2 text-base font-semibold text-foreground outline-none hover:bg-surface focus-visible:bg-surface"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-mint transition-colors group-hover:bg-brand-green">
                  <RoleIcon role={role.key} className="h-[22px] w-[22px] text-foreground" />
                </span>
                {role.label}
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}
