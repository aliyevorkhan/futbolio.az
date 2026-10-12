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
// center line. Our team only has 5 solid players — the 6th is the open
// slot below, the one we're actively looking for.
const OUR_TEAM: Player[] = [
  { cx: 33, cy: 150, isGoalkeeper: true },
  { cx: 85, cy: 70 },
  { cx: 85, cy: 230 },
  { cx: 140, cy: 105 },
  { cx: 140, cy: 195 },
];
// The open position, and the ball's home — the ball sits right next to
// the gap, as if waiting for a 6th player to arrive and receive it. This
// ties the ball's motion to the actual story (missing the 12th player),
// rather than drifting aimlessly mid-pitch.
const OUR_OPEN_SLOT: Player = { cx: 180, cy: 150 };
const BALL_HOME = { cx: 180, cy: 185 };

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
    <g className={cn(animate && "animate-ball-roll")} style={{ transformOrigin: `${cx}px ${cy}px` }}>
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
 * Inline composed SVG pitch illustration. Two 6-a-side formations — the
 * rival team is full, ours is missing its 6th player, marked with a
 * pulsing dashed "?" slot. The ball idles right next to that gap (not
 * drifting randomly), and a callout card points directly at the open
 * slot instead of floating at an unrelated spot. The ball also reacts to
 * the pointer by rolling toward it (magnet effect), settling back next
 * to the open slot on pointer-leave.
 */
export function HeroIllustration() {
  const t = useTranslations("home.hero");
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAnimate = useInViewAnimation(containerRef);
  const [ballOffset, setBallOffset] = useState<{ x: number; y: number } | null>(null);

  const reactToPoint = (clientX: number, clientY: number) => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * 400;
    const py = ((clientY - rect.top) / rect.height) * 300;
    const dx = px - BALL_HOME.cx;
    const dy = py - BALL_HOME.cy;
    const dist = Math.hypot(dx, dy) || 1;
    const pull = Math.min(16, dist / 4);
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

        {/* Open position: a soft pulsing ring draws the eye to the gap,
            then the dashed circle + "?" glyph mark it explicitly. */}
        <circle
          cx={OUR_OPEN_SLOT.cx}
          cy={OUR_OPEN_SLOT.cy}
          r="15"
          fill="none"
          stroke="#00E676"
          strokeWidth="2"
          className={cn(shouldAnimate && "animate-slot-pulse")}
          style={{ transformOrigin: `${OUR_OPEN_SLOT.cx}px ${OUR_OPEN_SLOT.cy}px` }}
        />
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

        <g
          style={{
            transform: ballOffset ? `translate(${ballOffset.x}px, ${ballOffset.y}px)` : undefined,
            transition: "transform 220ms ease-out",
          }}
        >
          <Ball cx={BALL_HOME.cx} cy={BALL_HOME.cy} animate={shouldAnimate && !ballOffset} />
        </g>
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
