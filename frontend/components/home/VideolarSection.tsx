"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useSettingsQuery } from "@/lib/queries/useSettingsQuery";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ExternalLink } from "@/components/shared/ExternalLink";

/**
 * "Videolar" section (`#videolar`): a grid of 9:16 cover-image cards
 * from `video_cards` in the public settings API, each linking out to
 * Instagram/TikTok. Cover-image only per spec — no on-site playback in
 * MVP. Renders nothing if `video_cards` is empty (no empty-state
 * placeholder needed for marketing content).
 */
export function VideolarSection() {
  const t = useTranslations("home.videolar");
  const { data: settings } = useSettingsQuery();

  const videoCards = settings?.video_cards ?? [];

  if (videoCards.length === 0) {
    return null;
  }

  return (
    <section id="videolar" className="py-16 sm:py-24">
      <Container>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {videoCards.map((card) => (
            <ExternalLink
              key={card.id}
              href={card.link}
              analyticsLabel="video_card_click"
              className="group relative block aspect-[9/16] overflow-hidden rounded-xl bg-brand-dark"
            >
              <Image
                src={card.cover_image_url}
                alt={card.caption || ""}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {card.caption ? (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs font-medium text-white">
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
