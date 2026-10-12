"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { useInViewAnimation } from "@/lib/hooks/useInViewAnimation";
import { cn } from "@/lib/utils";

interface Player {
  cx: number;
  cy: number;
  isGoalkeeper?: boolean;
}

// 6-a-side on each team (goalkeeper + 5 outfield), symmetric across the
// center line. One of our outfield slots (the last one) is rendered as
// the dashed "open position" marker instead of a solid dot — the one
// player we're still missing.
const OUR_TEAM: Player[] = [
  { cx: 33, cy: 150, isGoalkeeper: true },
  { cx: 85, cy: 70 },
  { cx: 85, cy: 230 },
  { cx: 140, cy: 105 },
  { cx: 140, cy: 195 },
];
const OUR_OPEN_SLOT: Player = { cx: 175, cy: 150 };

const RIVAL_TEAM: Player[] = [
  { cx: 367, cy: 150, isGoalkeeper: true },
  { cx: 315, cy: 70 },
  { cx: 315, cy: 230 },
  { cx: 260, cy: 105 },
  { cx: 260, cy: 195 },
  { cx: 225, cy: 150 },
];

/** A proper soccer ball: white body, a few black pentagon facets, soft drop shadow, spins while it drifts. */
function Ball({ cx, cy, animate }: { cx: number; cy: number; animate: boolean }) {
  return (
    <g
      className={cn(animate && "animate-ball-roll")}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <ellipse cx={cx} cy={cy + 8} rx="9" ry="3" fill="#0A1410" opacity="0.18" />
      <circle cx={cx} cy={cy} r="8" fill="#FFFFFF" stroke="#0A1410" strokeWidth="1.25" />
      <g className={cn(animate && "animate-ball-spin")} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <polygon
          points={`${cx},${cy - 4} ${cx + 3.2},${cy - 1.2} ${cx + 2},${cy + 3} ${cx - 2},${cy + 3} ${cx - 3.2},${cy - 1.2}`}
          fill="#0A1410"
        />
        <circle cx={cx - 6} cy={cy + 3} r="1.6" fill="#0A1410" />
        <circle cx={cx + 6} cy={cy + 3} r="1.6" fill="#0A1410" />
        <circle cx={cx} cy={cy - 7} r="1.3" fill="#0A1410" />
      </g>
    </g>
  );
}

/**
 * Inline composed SVG pitch illustration. Two full 6-a-side formations
 * (goalkeeper + 5 outfield each), one open outfield slot on our team
 * marked with a dashed "?" circle, and a real-looking soccer ball that
 * idles with a gentle drift/spin and reacts to the pointer by rolling
 * toward it (magnet effect), reverting to its idle animation on
 * pointer-leave. Touch taps trigger the same reaction briefly.
 */
export function HeroIllustration() {
  const t = useTranslations("home.hero");
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAnimate = useInViewAnimation(containerRef);
  const [ballOffset, setBallOffset] = useState<{ x: number; y: number } | null>(null);

  const ballHome = { cx: 230, cy: 150 };

  const reactToPoint = (clientX: number, clientY: number) => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * 400;
    const py = ((clientY - rect.top) / rect.height) * 300;
    const dx = px - ballHome.cx;
    const dy = py - ballHome.cy;
    const dist = Math.hypot(dx, dy) || 1;
    const pull = Math.min(14, dist / 4);
    setBallOffset({ x: (dx / dist) * pull, y: (dy / dist) * pull });
  };

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={t("illustrationAlt")}
      className="relative mx-auto w-full max-w-md"
      onPointerMove={(event) => reactToPoint(event.clientX, event.clientY)}
      onPointerLeave={() => setBallOffset(null)}
      onPointerDown={(event) => reactToPoint(event.clientX, event.clientY)}
    >
      <svg viewBox="0 0 400 300" aria-hidden="true" className="h-auto w-full">
        {/* Pitch boundary + markings */}
        <rect x="10" y="10" width="380" height="280" rx="10" fill="#F2F4F3" stroke="#0A1410" strokeWidth="2" />
        <line x1="200" y1="10" x2="200" y2="290" stroke="#0A1410" strokeWidth="2" />
        <circle cx="200" cy="150" r="42" fill="none" stroke="#0A1410" strokeWidth="2" />
        <circle cx="200" cy="150" r="2.5" fill="#0A1410" />
        <rect x="10" y="95" width="46" height="110" fill="none" stroke="#0A1410" strokeWidth="2" />
        <rect x="344" y="95" width="46" height="110" fill="none" stroke="#0A1410" strokeWidth="2" />

        {OUR_TEAM.map((p, i) => (
          <circle
            key={`our-${i}`}
            cx={p.cx}
            cy={p.cy}
            r={p.isGoalkeeper ? 10 : 9}
            fill="#0A1410"
            stroke={p.isGoalkeeper ? "#00E676" : undefined}
            strokeWidth={p.isGoalkeeper ? 2 : undefined}
          />
        ))}

        {RIVAL_TEAM.map((p, i) => (
          <circle
            key={`rival-${i}`}
            cx={p.cx}
            cy={p.cy}
            r={p.isGoalkeeper ? 10 : 9}
            fill="#FFFFFF"
            stroke="#0A1410"
            strokeWidth={p.isGoalkeeper ? 2.5 : 2}
          />
        ))}

        <g
          style={{
            transform: ballOffset ? `translate(${ballOffset.x}px, ${ballOffset.y}px)` : undefined,
            transition: "transform 220ms ease-out",
          }}
        >
          <Ball cx={ballHome.cx} cy={ballHome.cy} animate={shouldAnimate && !ballOffset} />
        </g>

        {/* Open position: dashed circle with a "?" glyph — an outfield slot, not the goalkeeper */}
        <circle
          cx={OUR_OPEN_SLOT.cx}
          cy={OUR_OPEN_SLOT.cy}
          r="15"
          fill="#F2F4F3"
          stroke="#0A1410"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <text x={OUR_OPEN_SLOT.cx} y={OUR_OPEN_SLOT.cy + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="#0A1410">
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
          <p className="truncate text-xs font-semibold text-foreground">{t("notificationTitle")}</p>
          <p className="truncate text-[11px] text-muted">{t("notificationMeta")}</p>
        </div>
      </div>
    </div>
  );
}
