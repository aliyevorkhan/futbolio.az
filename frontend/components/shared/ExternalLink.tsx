"use client";

import { track } from "@/lib/analytics";

export interface ExternalLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Analytics label identifying which link this is (e.g. "hero_whatsapp_cta"). */
  analyticsLabel?: string;
}

/**
 * Every outbound link (WhatsApp, phone, Instagram, TikTok, etc.) MUST
 * go through this component instead of a hand-rolled
 * `<a target="_blank">`. It enforces `target="_blank" rel="noopener"`
 * and fires an analytics event on click so click-through tracking is
 * consistent across the whole site.
 */
export function ExternalLink({
  href,
  analyticsLabel,
  onClick,
  children,
  ...props
}: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={(event) => {
        track("external_link_click", {
          href,
          label: analyticsLabel,
        });
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
