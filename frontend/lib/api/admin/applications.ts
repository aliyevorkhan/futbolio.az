import { adminApiFetch } from "@/lib/api/client";

/**
 * Admin applications endpoints. Types below mirror
 * `applications/serializers.py` on the backend exactly (verified against
 * a live production response, not guessed): the list endpoint exposes a
 * single flattened `position` string (the backend's own "headline
 * position" concept, resolved server-side via `headline_position()` from
 * whichever of player_details/referee_details/medic_details applies —
 * player: main_position code, referee: years_refereeing duration code,
 * medic: comma-joined specialty codes) rather than the raw per-role
 * objects — those only appear on the detail endpoint.
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
  date_of_birth: string;
  district: string;
  phone: string;
  status: ApplicationStatus;
  created_at: string;
  is_duplicate: boolean;
  /** Headline role-specific field — see the module doc for the shape per role. */
  position: string;
  /** Player-only `experience_level` code; empty string for referee/medic. */
  level: string;
  files: FileListSummary[];
  /** Signed, short-lived thumbnail URL; null until a clean photo exists. */
  photo_thumbnail_url: string | null;
}

export interface PlayerProfessionalPeriod {
  start_year: number;
  end_year: number;
  club: string;
}

export interface PlayerDetails {
  main_position: string;
  extra_positions: string[];
  preferred_foot: string;
  years_playing: string;
  club_experience_text: string;
  experience_level: string;
  has_pro_experience: boolean;
  hourly_rate_azn: number;
  is_university_student: boolean;
  university_name: string;
  course_year: number | null;
  professional_periods: PlayerProfessionalPeriod[];
}

export interface RefereeDetails {
  has_official_certification: boolean;
  certification_name: string;
  certification_link: string;
  years_refereeing: string;
  game_types: string[];
  experience_text: string;
}

export interface MedicDetails {
  specialty: string[];
  equipment_status: string;
  equipment_missing_text: string;
  work_experience: string;
  workplace: string;
}

export interface Availability {
  /** Composite "weekday:hour_slot" strings, e.g. "monday:09_12". */
  time_slots: string[];
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
  date_of_birth: string;
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
  level?: string;
  position?: string;
  time_slot?: string;
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

export async function updateApplicationPhone(
  id: string,
  phone: string,
): Promise<ApplicationDetail> {
  return adminApiFetch<ApplicationDetail>(`/api/admin/applications/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ phone }),
  });
}

export interface DuplicatePhoneApplication {
  id: string;
  full_name: string;
  role: ApplicationRole;
  status: ApplicationStatus;
  created_at: string;
}

export interface DuplicatePhoneGroup {
  phone: string;
  applications: DuplicatePhoneApplication[];
}

export async function listDuplicatePhoneGroups(): Promise<DuplicatePhoneGroup[]> {
  return adminApiFetch<DuplicatePhoneGroup[]>("/api/admin/applications/duplicate-phones/");
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
  /** Inline-renderable (no forced download) — safe for img/video/iframe src. */
  url: string;
  /** Forces a save-as dialog — use for the explicit "Yüklə" action. */
  download_url: string;
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
