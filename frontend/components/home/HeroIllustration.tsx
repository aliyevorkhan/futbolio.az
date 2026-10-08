"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useInViewAnimation } from "@/lib/hooks/useInViewAnimation";
import { cn } from "@/lib/utils";

/**
 * Inline composed SVG pitch illustration — replaces the old flat
 * `/illustrations/pitch.svg` image so individual parts (in particular
 * one "ball" dot) can be targeted by the ball-roll motion effect, and a
 * dashed "open position" circle can carry a "?" glyph. The whole group
 * is one `role="img"` unit for a11y; every inner SVG/HTML part is
 * decorative (`aria-hidden`).
 */
export function HeroIllustration() {
  const t = useTranslations("home.hero");
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAnimate = useInViewAnimation(containerRef);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={t("illustrationAlt")}
      className="relative mx-auto w-full max-w-md"
    >
      <svg viewBox="0 0 400 300" aria-hidden="true" className="h-auto w-full">
        {/* Pitch boundary + markings */}
        <rect
          x="10"
          y="10"
          width="380"
          height="280"
          rx="10"
          fill="#F2F4F3"
          stroke="#0A1410"
          strokeWidth="2"
        />
        <line x1="200" y1="10" x2="200" y2="290" stroke="#0A1410" strokeWidth="2" />
        <circle cx="200" cy="150" r="42" fill="none" stroke="#0A1410" strokeWidth="2" />
        <circle cx="200" cy="150" r="2.5" fill="#0A1410" />
        <rect x="10" y="95" width="46" height="110" fill="none" stroke="#0A1410" strokeWidth="2" />
        <rect x="344" y="95" width="46" height="110" fill="none" stroke="#0A1410" strokeWidth="2" />

        {/* Players: mix of solid dark + white/outlined dots */}
        <circle cx="95" cy="65" r="9" fill="#0A1410" />
        <circle cx="130" cy="210" r="9" fill="#0A1410" />
        <circle cx="175" cy="95" r="9" fill="#FFFFFF" stroke="#0A1410" strokeWidth="2" />
        <circle cx="235" cy="85" r="9" fill="#FFFFFF" stroke="#0A1410" strokeWidth="2" />
        <circle cx="265" cy="215" r="9" fill="#0A1410" />
        <circle cx="305" cy="155" r="9" fill="#FFFFFF" stroke="#0A1410" strokeWidth="2" />
        <circle cx="120" cy="150" r="9" fill="#0A1410" />
        <circle
          cx="205"
          cy="235"
          r="9"
          fill="#00E676"
          stroke="#0A1410"
          strokeWidth="1.5"
          className={cn(shouldAnimate && "animate-ball-roll")}
        />

        {/* Open position: dashed circle with a "?" glyph */}
        <circle
          cx="330"
          cy="65"
          r="15"
          fill="#F2F4F3"
          stroke="#0A1410"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <text x="330" y="70" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0A1410">
          ?
        </text>
      </svg>

      <div
        aria-hidden="true"
        className="absolute inset-x-4 bottom-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-brand-dark">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">
            {t("notificationTitle")}
          </p>
          <p className="truncate text-[11px] text-muted">{t("notificationMeta")}</p>
        </div>
      </div>
    </div>
  );
}
