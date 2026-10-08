"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ExternalLink } from "@/components/shared/ExternalLink";
import { PitchPatternFallback } from "@/components/home/PitchPatternFallback";

/**
 * "Videolar" section (`#videolar`): full-bleed near-black band with a
 * grid of 9:16 cards from `video_cards` in the public settings API.
 * Keeps the real `cover_image_url` as background when present; falls
 * back to `PitchPatternFallback` (abstract pattern, no asset) when
 * absent. Both cases get the same centered play-button overlay + a
 * pill showing the raw, admin-authored `caption` verbatim (no parsing —
 * caption shape is unknown, don't guess a split rule). Renders nothing
 * if `video_cards` is empty.
 */
export function VideolarSection() {
  const t = useTranslations("home.videolar");
  const { data: settings } = useSettingsQuery();

  const videoCards = settings?.video_cards ?? [];

  if (videoCards.length === 0) {
    return null;
  }

  return (
    <section id="videolar" className="bg-brand-dark py-16 text-white sm:py-24">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
            titleClassName="text-white"
            descriptionClassName="text-white/70"
          />

          <div className="flex shrink-0 gap-2">
            {settings?.instagram_url ? (
              <ExternalLink
                href={settings.instagram_url}
                analyticsLabel="videolar_instagram"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                Instagram
              </ExternalLink>
            ) : null}
            {settings?.tiktok_url ? (
              <ExternalLink
                href={settings.tiktok_url}
                analyticsLabel="videolar_tiktok"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                TikTok
              </ExternalLink>
            ) : null}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {videoCards.map((card) => (
            <ExternalLink
              key={card.id}
              href={card.link}
              analyticsLabel="video_card_click"
              className="group relative block aspect-[9/16] overflow-hidden rounded-xl bg-brand-dark"
            >
              {card.cover_image_url ? (
                <Image
                  src={card.cover_image_url}
                  alt={card.caption || ""}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <PitchPatternFallback />
              )}

              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green text-brand-dark transition-transform duration-200 group-hover:scale-110">
                  <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                </span>
              </span>

              {card.caption ? (
                <span className="absolute inset-x-3 bottom-3 truncate rounded-full bg-white px-3 py-1 text-xs font-medium text-foreground">
                  {card.caption}
                </span>
              ) : null}
            </ExternalLink>
          ))}
        </div>
      </Container>
    </section>
  );
}
