/**
 * Accepts any well-formed http(s) URL — not restricted to a specific
 * domain allowlist, matching the backend's `validate_video_link_domain`.
 */
export function isValidVideoLinkUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
