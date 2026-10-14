"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 1, 1.5, 2] as const;

export function VideoPlayer({ src }: { src: string }) {
  const t = useTranslations("admin.applicationDetail.files");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  function setPlaybackRate(rate: (typeof SPEEDS)[number]) {
    setSpeed(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
  }

  return (
    <div className="flex flex-col gap-2">
      <video ref={videoRef} src={src} controls className="max-h-96 w-full rounded-lg bg-black" />
      <div className="flex items-center gap-1.5 text-xs">
        <span className="font-medium text-muted">{t("videoSpeed")}:</span>
        {SPEEDS.map((rate) => (
          <button
            key={rate}
            type="button"
            onClick={() => setPlaybackRate(rate)}
            className={cn(
              "rounded-full px-2.5 py-1 font-semibold transition-colors",
              speed === rate
                ? "bg-brand-dark text-white"
                : "bg-surface text-muted hover:bg-brand-dark/10",
            )}
          >
            {rate}x
          </button>
        ))}
      </div>
    </div>
  );
}
