import type { z } from "zod";

/**
 * Centralizes the "field X is required only when sibling field Y has a
 * specific value" pattern, used three times across Step 2's per-role
 * schemas (player's `professional_periods` when `has_played_professionally`
 * is true, referee's `certification_name` when `has_official_certification`
 * is true, medic's `equipment_missing_text` when `equipment_status ===
 * "partial"`). Call from inside the owning object schema's own
 * `.superRefine((data, ctx) => ...)` — this just adds the issue, it
 * doesn't own the refine wiring itself, since each caller's condition
 * and field shape differ.
 */
export function requireWhenFilled(
  ctx: z.RefinementCtx,
  condition: boolean,
  value: string | unknown[] | undefined | null,
  path: (string | number)[],
  message: string,
): void {
  if (!condition) return;
  const isEmpty =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0);
  if (isEmpty) {
    ctx.addIssue({ code: "custom", message, path });
  }
}
