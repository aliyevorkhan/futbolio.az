import { adminApiFetch } from "@/lib/api/client";
import type { PaginatedResponse } from "@/lib/api/admin/applications";

/**
 * Admin settings + video-cards + FAQ CRUD endpoints. video-cards/faq are
 * standard DRF ModelViewSet routes sitting behind the project's global
 * `DEFAULT_PAGINATION_CLASS` (see `common/pagination.py`), so their list
 * responses are paginated like every other admin list endpoint, not bare
 * arrays.
 */

export interface AdminSettings {
  whatsapp_number: string;
  whatsapp_default_text: string;
  phone_number: string;
  instagram_url: string;
  instagram_dm_url: string;
  tiktok_url: string;
}

export async function getAdminSettings(): Promise<AdminSettings> {
  return adminApiFetch<AdminSettings>("/api/admin/settings/");
}

export async function updateAdminSettings(
  payload: Partial<AdminSettings>,
): Promise<AdminSettings> {
  return adminApiFetch<AdminSettings>("/api/admin/settings/", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// --- Video cards (standard DRF ModelViewSet REST routes) ---

export interface VideoCard {
  id: string;
  link: string;
  cover_image_key: string;
  caption: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type VideoCardPayload = Partial<
  Pick<VideoCard, "link" | "cover_image_key" | "caption" | "order" | "is_active">
>;

// `page_size=200` (the backend's max) rather than real pagination UI here —
// video cards are a small, hand-curated content list, not a growing table.
// The model's own Meta.ordering (`order`, then `created_at`) already sorts
// results the way the admin UI wants.
export async function listVideoCards(): Promise<PaginatedResponse<VideoCard>> {
  return adminApiFetch("/api/admin/video-cards/?page_size=200");
}

export async function createVideoCard(payload: VideoCardPayload): Promise<VideoCard> {
  return adminApiFetch("/api/admin/video-cards/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVideoCard(
  id: string,
  payload: VideoCardPayload,
): Promise<VideoCard> {
  return adminApiFetch(`/api/admin/video-cards/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteVideoCard(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/video-cards/${id}/`, { method: "DELETE" });
}

// --- FAQ (standard DRF ModelViewSet REST routes) ---

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FaqItemPayload = Partial<
  Pick<FaqItem, "question" | "answer" | "order" | "is_active">
>;

export async function listFaq(): Promise<PaginatedResponse<FaqItem>> {
  return adminApiFetch("/api/admin/faq/?page_size=200");
}

export async function createFaq(payload: FaqItemPayload): Promise<FaqItem> {
  return adminApiFetch("/api/admin/faq/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFaq(id: string, payload: FaqItemPayload): Promise<FaqItem> {
  return adminApiFetch(`/api/admin/faq/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteFaq(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/faq/${id}/`, { method: "DELETE" });
}
