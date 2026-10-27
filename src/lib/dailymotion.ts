const API = "https://api.dailymotion.com";
const ID_RE = /^x[a-z0-9]+$/;
const VIDEO_FIELDS = "id,title,thumbnail_720_url,duration,allow_embed,private,status";

export type DmRef = { kind: "video" | "playlist"; id: string };

export type DmVideo = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
};

type ApiVideo = {
  id: string;
  title?: string;
  thumbnail_720_url?: string;
  duration?: number;
  allow_embed?: boolean;
  private?: boolean;
  status?: string;
};

export const isDmId = (id: string) => ID_RE.test(id);

/** The official Dailymotion player. We only ever embed this, never the raw video file. */
export const dmEmbedUrl = (id: string) => `https://geo.dailymotion.com/player.html?video=${id}`;

/**
 * Pulls a video or playlist ID out of anything the admin pastes:
 *   https://www.dailymotion.com/video/x8abc12      https://dai.ly/x8abc12
 *   https://www.dailymotion.com/embed/video/x8abc12
 *   https://geo.dailymotion.com/player.html?video=x8abc12
 *   https://www.dailymotion.com/playlist/x6hynp     <iframe src="..."></iframe>
 * Returns null when the input is not a Dailymotion link (or the ID fails the ^x[a-z0-9]+$ check).
 */
export function parseDailymotion(raw: string): DmRef | null {
  let input = raw.trim();
  const iframe = input.match(/^<iframe[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  if (iframe) input = iframe[1];
  if (input.startsWith("//")) input = `https:${input}`;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);
  const pick = (kind: DmRef["kind"], id: string | null | undefined): DmRef | null => {
    const clean = id?.split("_")[0];
    return clean && isDmId(clean) ? { kind, id: clean } : null;
  };

  if (host === "dai.ly") return pick("video", segments[0]);
  if (host !== "dailymotion.com" && !host.endsWith(".dailymotion.com")) return null;

  const video = url.searchParams.get("video");
  if (video) return pick("video", video);
  const playlist = url.searchParams.get("playlist");
  if (playlist) return pick("playlist", playlist);
  const v = segments.indexOf("video");
  if (v !== -1) return pick("video", segments[v + 1]);
  const p = segments.indexOf("playlist");
  if (p !== -1) return pick("playlist", segments[p + 1]);
  return null;
}

/** Why a video can't be embedded, or null when it is fine to show. */
function blockReason(v: ApiVideo): string | null {
  if (v.private) return "the video is private";
  if (v.allow_embed === false) return "the owner turned off embedding";
  if (v.status && v.status !== "published") return `the video is ${v.status}`;
  return null;
}

function toVideo(v: ApiVideo): DmVideo {
  return {
    id: v.id,
    title: v.title ?? "",
    thumbnailUrl: v.thumbnail_720_url ?? null,
    durationSec: v.duration ? Math.round(v.duration) : null,
  };
}

async function api<T>(path: string): Promise<{ status: number; data: T | null }> {
  const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(15000), cache: "no-store" });
  return { status: res.status, data: res.ok ? ((await res.json()) as T) : null };
}

export async function fetchDmVideo(id: string): Promise<DmVideo | { error: string }> {
  if (!isDmId(id)) return { error: `Invalid Dailymotion ID: ${id}` };
  const { status, data } = await api<ApiVideo>(`/video/${id}?fields=${VIDEO_FIELDS}`);
  if (status === 404) return { error: `Video ${id} does not exist (deleted?)` };
  if (!data) return { error: `Dailymotion API error ${status} for ${id}` };
  const reason = blockReason(data);
  return reason ? { error: `Video ${id} rejected: ${reason}` } : toVideo(data);
}

/** Every embeddable video in a playlist, in playlist order. Unembeddable ones are listed in `skipped`. */
export async function fetchDmPlaylist(id: string): Promise<{ videos: DmVideo[]; skipped: string[] } | { error: string }> {
  if (!isDmId(id)) return { error: `Invalid Dailymotion playlist ID: ${id}` };
  const videos: DmVideo[] = [];
  const skipped: string[] = [];
  for (let page = 1; page <= 50; page++) {
    const { status, data } = await api<{ list: ApiVideo[]; has_more: boolean }>(
      `/playlist/${id}/videos?fields=${VIDEO_FIELDS}&limit=100&page=${page}`,
    );
    if (status === 404) return { error: `Playlist ${id} does not exist` };
    if (!data) return { error: `Dailymotion API error ${status} for playlist ${id}` };
    for (const v of data.list) {
      const reason = blockReason(v);
      if (reason) skipped.push(`${v.id}: ${reason}`);
      else videos.push(toVideo(v));
    }
    if (!data.has_more) break;
  }
  return { videos, skipped };
}

/**
 * Checks up to 100 IDs per API call. Returns the IDs that are still fine to embed;
 * anything missing was deleted, made private, or had embedding turned off.
 * Throws on API failure so a Dailymotion outage never marks everything dead.
 */
export async function checkDmVideos(ids: string[]): Promise<Set<string>> {
  const ok = new Set<string>();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100).filter(isDmId);
    if (!chunk.length) continue;
    const { status, data } = await api<{ list: ApiVideo[] }>(
      `/videos?ids=${chunk.join(",")}&fields=id,allow_embed,private,status&limit=100`,
    );
    if (!data) throw new Error(`Dailymotion API error ${status}`);
    for (const v of data.list) if (!blockReason(v)) ok.add(v.id);
  }
  return ok;
}
