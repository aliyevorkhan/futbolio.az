"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface JerseySpec {
  x: number;
  y: number;
  num: number;
  variant: "dark" | "light";
}

// Our team: goalkeeper + 4 outfield (5 total) — the striker slot is the
// "?" opening below, not a solid jersey. Rival team: goalkeeper + 5
// outfield (6 total, full squad). Coordinates are the prototype's exact
// transform values on a 640x480 viewBox.
const JERSEYS: JerseySpec[] = [
  { x: 52, y: 240, num: 1, variant: "dark" },
  { x: 150, y: 130, num: 4, variant: "dark" },
  { x: 150, y: 350, num: 5, variant: "dark" },
  { x: 228, y: 180, num: 8, variant: "dark" },
  { x: 228, y: 300, num: 6, variant: "dark" },
  { x: 588, y: 240, num: 1, variant: "light" },
  { x: 490, y: 130, num: 3, variant: "light" },
  { x: 490, y: 350, num: 2, variant: "light" },
  { x: 412, y: 180, num: 10, variant: "light" },
  { x: 412, y: 300, num: 7, variant: "light" },
  { x: 362, y: 240, num: 9, variant: "light" },
];

const JERSEY_PATH =
  "M-7 -14 L-16 -9 L-20 -1 L-13 3 L-12 0 L-12 14 L12 14 L12 0 L13 3 L20 -1 L16 -9 L7 -14 Q0 -9 -7 -14Z";

function Jersey({ x, y, num, variant }: JerseySpec) {
  const dark = variant === "dark";
  return (
    <g transform={`translate(${x},${y}) scale(1.4)`}>
      <ellipse cx="0" cy="17" rx="15" ry="4" fill="#000" fillOpacity="0.18" />
      <path
        d={JERSEY_PATH}
        fill={dark ? "#0A1410" : "#FFFFFF"}
        stroke={dark ? undefined : "#0A1410"}
        strokeWidth={dark ? undefined : 1.5}
      />
      <text x="0" y="8" textAnchor="middle" fontFamily="Montserrat,sans-serif" fontWeight="700" fontSize="12" fill={dark ? "#FFFFFF" : "#0A1410"}>
        {num}
      </text>
    </g>
  );
}

interface HeroIllustrationProps {
  onOpenRoleMenu: (anchorRect: DOMRect) => void;
}

/**
 * The hero's pitch "stage": a perspective-tilted stadium (striped pitch,
 * full markings, two 6-a-side formations rendered as numbered jerseys)
 * with one open "?" slot — our missing striker — and a status card
 * below. The "?" slot and the sticky/desktop "Oyunçu tap" buttons
 * (rendered by the parent) all open the same role-selection menu.
 */
export function HeroIllustration({ onOpenRoleMenu }: HeroIllustrationProps) {
  const t = useTranslations("home.hero");

  return (
    <div className="relative mt-7 pb-11 lg:mt-0" style={{ perspective: "1100px" }}>
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-[22px] shadow-[0_30px_50px_-20px_rgba(10,20,16,0.45),0_0_0_6px_#fff] lg:rounded-[28px]"
        style={{ transform: "rotateX(16deg)", transformOrigin: "50% 100%" }}
      >
        <svg viewBox="0 0 640 480" aria-hidden="true" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="hero-pitch-vignette" cx="50%" cy="45%" r="70%">
              <stop offset="60%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
            </radialGradient>
          </defs>
          {/* Striped turf */}
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={i * 64} y="0" width="64" height="480" fill={i % 2 === 0 ? "#00E676" : "#00D96E"} />
          ))}
          <rect width="640" height="480" fill="url(#hero-pitch-vignette)" />

          <g fill="none" stroke="#fff" strokeWidth="3" strokeOpacity="0.95">
            <rect x="20" y="20" width="600" height="440" />
            <line x1="320" y1="20" x2="320" y2="460" />
            <circle cx="320" cy="240" r="58" />
            <rect x="20" y="130" width="92" height="220" />
            <rect x="20" y="190" width="34" height="100" />
            <path d="M112 205 A45 45 0 0 1 112 275" />
            <rect x="528" y="130" width="92" height="220" />
            <rect x="586" y="190" width="34" height="100" />
            <path d="M528 205 A45 45 0 0 0 528 275" />
            <path d="M20 32 A12 12 0 0 0 32 20" />
            <path d="M608 20 A12 12 0 0 0 620 32" />
            <path d="M20 448 A12 12 0 0 1 32 460" />
            <path d="M608 460 A12 12 0 0 1 620 448" />
          </g>
          <g fill="#fff">
            <circle cx="320" cy="240" r="4" />
            <circle cx="82" cy="240" r="3.5" />
            <circle cx="558" cy="240" r="3.5" />
          </g>
          <g fill="none" stroke="#fff" strokeWidth="3">
            <path d="M20 196 H2 V284 H20" />
            <path d="M620 196 H638 V284 H620" />
          </g>

          {JERSEYS.map((jersey, index) => (
            <Jersey key={index} {...jersey} />
          ))}
        </svg>

        <button
          type="button"
          onClick={(event) => onOpenRoleMenu(event.currentTarget.getBoundingClientRect())}
          aria-label={t("slotAriaLabel")}
          className="group absolute aspect-square w-[15%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: "44.5%", top: "50%" }}
        >
          <span
            aria-hidden="true"
            className="animate-slot-pulse absolute inset-0 rounded-full bg-white/55"
          />
          <span className="relative flex h-full w-full items-center justify-center rounded-full border-[2.5px] border-dashed border-brand-dark bg-white text-[15px] font-bold text-brand-dark transition-colors group-hover:bg-brand-dark group-hover:text-white lg:text-xl">
            ?
          </span>
          <em
            className={cn(
              "pointer-events-none absolute left-[110%] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-brand-dark px-2.5 py-1.5 text-xs font-semibold not-italic text-white opacity-0 transition-opacity",
              "group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          >
            {t("slotTooltip")}
          </em>
        </button>
      </div>

      {/* Sibling of the tilted stage (not a child) — stays flat while
          visually overlapping the stage's bottom edge. */}
      <div className="absolute inset-x-[18px] bottom-0 flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(10,20,16,0.08)] lg:inset-x-7">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green">
          <Check className="h-4 w-4 text-brand-dark" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground lg:text-base">{t("notificationTitle")}</p>
          <p className="truncate text-xs text-muted lg:text-sm">{t("notificationMeta")}</p>
        </div>
      </div>
    </div>
  );
}
