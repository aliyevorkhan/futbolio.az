import { apiFetch } from "@/lib/api/client";

export interface VideoCard {
  id: number | string;
  link: string;
  cover_image_url: string;
  caption: string;
}

export interface FaqEntry {
  id: number | string;
  question: string;
  answer: string;
}

export interface PublicSettings {
  whatsapp_number: string;
  whatsapp_default_text: string;
  phone_number: string;
  instagram_url: string;
  instagram_dm_url: string;
  tiktok_url: string;
  video_cards: VideoCard[];
  faq: FaqEntry[];
}

export function getPublicSettings(): Promise<PublicSettings> {
  return apiFetch<PublicSettings>("/api/public/settings/", {
    // Public marketing data — fine to cache briefly at the fetch layer
    // in addition to whatever TanStack Query does client-side.
    next: { revalidate: 60 },
  });
}
