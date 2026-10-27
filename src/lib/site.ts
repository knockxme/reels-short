export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "DramaFlix";
export const SITE_TAGLINE = "Watch Full Short Dramas Online Free with English Subtitles";
export const SITE_DESCRIPTION =
  "Watch full Korean, Chinese, Thai and Japanese short dramas online in HD with English subtitles. Every story complete in one video, made for your phone. New titles added daily.";

export const PAGE_SIZE = 24;

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const dramaPath = (slug: string) => `/drama/${slug}`;

/** 5460 → "1h 31m", 2400 → "40 min". */
export function formatDuration(sec: number | null | undefined) {
  if (!sec || sec < 60) return null;
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}` : `${m} min`;
}
