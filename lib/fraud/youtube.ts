import type { VideoMeta } from "./types";

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Pull an 11-char YouTube video id out of any common URL shape (or a bare id). */
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (ID_RE.test(raw)) return raw;

  let u: URL;
  try {
    u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return ID_RE.test(id) ? id : null;
  }
  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const v = u.searchParams.get("v");
    if (v && ID_RE.test(v)) return v;
    const m = u.pathname.match(/\/(?:shorts|embed|v|live)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

export function watchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
export function embedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}`;
}
export function thumbUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Best-effort metadata fetch with no API key required:
 *   - title / author / thumbnail via the public oEmbed endpoint
 *   - duration by scraping "lengthSeconds" out of the watch page
 * Any of these may be unavailable (region locks, age gates); callers handle nulls.
 */
export async function fetchVideoMeta(id: string): Promise<VideoMeta> {
  const url = watchUrl(id);
  let title = `YouTube clip ${id}`;
  let author: string | null = null;
  let thumbnail = thumbUrl(id);

  try {
    const o = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { headers: { "user-agent": "Mozilla/5.0" }, cache: "no-store" },
    );
    if (o.ok) {
      const j = (await o.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
      if (j.title) title = j.title;
      if (j.author_name) author = j.author_name;
      if (j.thumbnail_url) thumbnail = j.thumbnail_url;
    }
  } catch {
    // ignore — keep defaults
  }

  const durationSec = await fetchDurationSec(id);
  return { id, url, title, author, durationSec, thumbnail };
}

/** Scrape the watch page for the video length. Returns null if it can't be read. */
export async function fetchDurationSec(id: string): Promise<number | null> {
  try {
    const res = await fetch(watchUrl(id), {
      headers: { "user-agent": "Mozilla/5.0", "accept-language": "en-US,en;q=0.9" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/"lengthSeconds":"(\d+)"/);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}
