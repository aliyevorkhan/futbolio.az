import { adminApiFetch } from "@/lib/api/client";
import type { PaginatedResponse } from "@/lib/api/admin/applications";

/**
 * Read-only — the backend never exposes a delete/update route for this
 * model (immutable forensic log). Used on the application detail page to
 * surface events that don't appear in `status_history` (e.g. a hard
 * delete, a phone edit) alongside the status timeline.
 */
export interface AuditLogEntry {
  id: string;
  actor: string | null;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export async function listAuditLogForApplication(
  applicationId: string,
): Promise<PaginatedResponse<AuditLogEntry>> {
  return adminApiFetch<PaginatedResponse<AuditLogEntry>>(
    `/api/admin/audit-log/?target_type=application&target_id=${applicationId}&page_size=100`,
  );
}
