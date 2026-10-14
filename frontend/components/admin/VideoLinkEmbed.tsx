import { useTranslations } from "next-intl";

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const shortsMatch = u.pathname.match(/^\/shorts\/([^/]+)/);
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

function instagramEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "instagram.com") return null;
    if (!/^\/(p|reel|tv)\/[^/]+\/?$/.test(u.pathname)) return null;
    const path = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
    return `https://www.instagram.com${path}embed`;
  } catch {
    return null;
  }
}

/**
 * Renders a candidate's submitted video link inline when it's a
 * recognizable YouTube or Instagram post/reel URL (both support direct
 * iframe embedding, no external widget script needed); otherwise falls
 * back to an "open in a new tab" link, per spec.
 */
export function VideoLinkEmbed({ url }: { url: string }) {
  const t = useTranslations("admin.applicationDetail.files");
  const youtube = youtubeEmbedUrl(url);
  const instagram = !youtube ? instagramEmbedUrl(url) : null;
  const embedSrc = youtube ?? instagram;

  if (embedSrc) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-brand-dark/10">
        <iframe
          src={embedSrc}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand-dark/15 px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
    >
      {t("openOriginal")}
    </a>
  );
}
