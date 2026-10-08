import { adminApiFetch } from "@/lib/api/client";

/**
 * Admin applications endpoints. Types below mirror
 * `applications/serializers.py` on the backend exactly (verified against
 * source, not guessed): the list endpoint exposes a single flattened
 * `position` string (the backend's own "headline position" concept,
 * resolved server-side via `headline_position()` from whichever of
 * player_details/referee_details/medic_details applies) rather than the
 * raw per-role objects — those only appear on the detail endpoint.
 */

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ApplicationRole = "player" | "referee" | "medic";
export type ApplicationStatus =
  | "new"
  | "reviewed"
  | "contacted"
  | "accepted"
  | "rejected"
  | "archived";
export type FileKind = "photo" | "video" | "document";
export type ScanStatus = "pending" | "clean" | "infected" | "error";

export interface FileListSummary {
  id: string;
  kind: FileKind;
  scan_status: ScanStatus;
}

export interface FileDetailSummary extends FileListSummary {
  is_sensitive: boolean;
  original_name: string;
}

export interface ApplicationListItem {
  id: string;
  full_name: string;
  role: ApplicationRole;
  age: number;
  district: string;
  phone: string;
  status: ApplicationStatus;
  created_at: string;
  is_duplicate: boolean;
  /** Headline role-specific field (main_position / license_status / specialty). */
  position: string;
  files: FileListSummary[];
}

export interface PlayerDetails {
  main_position: string;
  extra_positions: string[];
  preferred_foot: string;
  years_playing: string;
  club_experience_text: string;
  self_rating: number;
}

export interface RefereeDetails {
  license_status: string;
  years_refereeing: string;
  game_types: string[];
  experience_text: string;
}

export interface MedicDetails {
  specialty: string;
  first_aid_cert: boolean;
  work_experience: string;
  workplace: string;
}

export interface Availability {
  days: string[];
  hours: string[];
  districts: string[];
}

export interface Consent {
  type: string;
  text_version: string;
  accepted: boolean;
  accepted_at: string;
}

export interface StatusChange {
  from_status: ApplicationStatus;
  to_status: ApplicationStatus;
  changed_by_email: string | null;
  changed_at: string;
  reason: string;
}

export interface AdminNote {
  // plain Django AutoField (int), unlike every UUID-keyed model elsewhere
  // in this API — verified against a live `GET .../notes/` response.
  id: number;
  text: string;
  admin_email: string;
  created_at: string;
}

/** Shape of the create endpoint's own response — no `admin_email` (the
 * create serializer is write-focused; re-fetch the detail/list to see it). */
export interface AdminNoteCreateResponse {
  id: number;
  text: string;
  created_at: string;
}

export interface ApplicationDetail {
  id: string;
  role: ApplicationRole;
  full_name: string;
  age: number;
  phone: string;
  instagram_handle: string;
  district: string;
  status: ApplicationStatus;
  is_duplicate: boolean;
  video_link_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  upload_session_id: string;
  created_at: string;
  updated_at: string;
  player_details: PlayerDetails | null;
  referee_details: RefereeDetails | null;
  medic_details: MedicDetails | null;
  availability: Availability | null;
  consents: Consent[];
  files: FileDetailSummary[];
  status_history: StatusChange[];
  notes: AdminNote[];
}

export interface ApplicationListParams {
  role?: string;
  district?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  self_rating?: string;
  position?: string;
  days?: string;
  hours?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

function toQueryString(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listApplications(
  params: ApplicationListParams = {},
): Promise<PaginatedResponse<ApplicationListItem>> {
  return adminApiFetch<PaginatedResponse<ApplicationListItem>>(
    `/api/admin/applications/${toQueryString(params)}`,
  );
}

export async function getApplication(id: string): Promise<ApplicationDetail> {
  return adminApiFetch<ApplicationDetail>(`/api/admin/applications/${id}/`);
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  reason?: string,
): Promise<ApplicationDetail> {
  return adminApiFetch<ApplicationDetail>(`/api/admin/applications/${id}/status/`, {
    method: "PATCH",
    body: JSON.stringify(reason ? { status, reason } : { status }),
  });
}

// Paginated like every other admin list endpoint (verified live) — the
// detail endpoint's embedded `notes` array is what the UI actually
// renders from, so this standalone wrapper is mostly for completeness.
export async function listApplicationNotes(
  id: string,
): Promise<PaginatedResponse<AdminNote>> {
  return adminApiFetch(`/api/admin/applications/${id}/notes/`);
}

export async function addApplicationNote(
  id: string,
  text: string,
): Promise<AdminNoteCreateResponse> {
  return adminApiFetch<AdminNoteCreateResponse>(`/api/admin/applications/${id}/notes/`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function deleteApplication(id: string): Promise<void> {
  await adminApiFetch(`/api/admin/applications/${id}/`, {
    method: "DELETE",
    body: JSON.stringify({ confirm: true }),
  });
}

export async function exportApplications(
  params: ApplicationListParams & { format: "csv" | "xlsx" },
): Promise<Blob> {
  const res = await adminApiFetch<Response>(
    `/api/admin/applications/export/${toQueryString(params)}`,
    { parseJson: false },
  );
  return res.blob();
}

export interface FileUrlResponse {
  url: string;
  scan_status: ScanStatus;
  original_name: string;
  kind: FileKind;
}

export async function getApplicationFileUrl(
  applicationId: string,
  fileId: string,
): Promise<FileUrlResponse> {
  return adminApiFetch<FileUrlResponse>(
    `/api/admin/applications/${applicationId}/files/${fileId}/url/`,
  );
}
