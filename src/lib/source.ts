import { dmEmbedUrl, parseDailymotion, type DmRef } from "./dailymotion";

export type SourceKind = "IFRAME" | "HLS" | "MP4" | "DAILYMOTION";

export type ParsedSource = { type: SourceKind; url: string };

/**
 * Accepts whatever the admin pastes: a Dailymotion link, a full <iframe> tag, an embed page URL,
 * an .m3u8 playlist or an .mp4 file. Only the URL is ever stored, never raw HTML.
 * Dailymotion videos are always stored as the official player URL.
 */
export function parseSourceInput(raw: string): ParsedSource | { error: string } {
  const input = raw.trim();
  if (!input) return { error: "Empty source" };

  const dm = parseDailymotion(input);
  if (dm?.kind === "playlist") return { error: "That is a playlist. Paste it in the bulk episode box on the drama page." };
  if (dm) return { type: "DAILYMOTION", url: dmEmbedUrl(dm.id) };

  let url = input;
  if (/^<iframe/i.test(input)) {
    const match = input.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!match) return { error: "Could not find src=\"...\" in the iframe code" };
    url = match[1];
  }
  if (url.startsWith("//")) url = `https:${url}`;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: `Invalid URL: ${url.slice(0, 80)}` };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { error: "Only http(s) links are allowed" };
  }
  if (parsed.username || parsed.password) return { error: "Links with a username or password are not allowed" };
  if (isPrivateHost(parsed.hostname)) return { error: "Links to local or private network addresses are not allowed" };

  const allowed = allowedHosts();
  if (allowed.length && !allowed.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
    return { error: `Host ${parsed.hostname} is not in ALLOWED_SOURCE_HOSTS` };
  }

  const path = parsed.pathname.toLowerCase();
  const type: SourceKind = path.endsWith(".m3u8") ? "HLS" : /\.(mp4|webm|m4v)$/.test(path) ? "MP4" : "IFRAME";
  return { type, url: parsed.toString() };
}

/** The link checker fetches source URLs from the server, so internal addresses must never be stored. */
function isPrivateHost(host: string) {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return true;
  if (/^(127|10|0)\./.test(h) || /^169\.254\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return true;
  if (h.includes(":") && (h === "::1" || h === "::" || /^f[cd]/.test(h) || /^fe80/.test(h) || h.startsWith("::ffff:"))) return true;
  return /^\d+$/.test(h); // decimal-encoded IPv4 like http://2130706433/
}

export function allowedHosts() {
  return (process.env.ALLOWED_SOURCE_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

export type BulkLine = { line: number; number: number | null; source: ParsedSource | DmRef };

/**
 * Bulk format, one episode per line:
 *   1 | https://www.dailymotion.com/video/x8abc12
 *   2 | <iframe src="..."></iframe>
 *   https://server/ep3.m3u8          (no number = next number)
 *   https://www.dailymotion.com/playlist/x6hynp   (adds every video in the playlist)
 * Numbers are assigned by the caller, because a playlist expands to an unknown count.
 */
export function parseBulkEpisodes(text: string) {
  const lines: BulkLine[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const m = line.match(/^(?:ep(?:isode)?\s*)?(\d+)\s*[|,\t]\s*(.+)$/i);
    const input = m ? m[2] : line;
    const number = m ? Number(m[1]) : null;
    const dm = parseDailymotion(input);
    if (dm) {
      lines.push({ line: i + 1, number, source: dm });
      return;
    }
    const parsed = parseSourceInput(input);
    if ("error" in parsed) errors.push(`Line ${i + 1}: ${parsed.error}`);
    else lines.push({ line: i + 1, number, source: parsed });
  });
  return { lines, errors };
}
