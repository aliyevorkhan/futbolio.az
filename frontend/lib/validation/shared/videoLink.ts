/** Hostnames accepted for `video_link_url` (player/referee), without `www.`. */
export const VIDEO_LINK_HOSTS = [
  "instagram.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "drive.google.com",
];

export function isValidVideoLinkUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return VIDEO_LINK_HOSTS.includes(host);
  } catch {
    return false;
  }
}
