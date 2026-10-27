import { SITE_URL } from "./site";

/** Google video sitemap entry: needs a thumbnail, title, description and a player or file URL. */
export type VideoEntry = {
  thumbnail: string;
  title: string;
  description: string;
  playerLoc?: string;
  contentLoc?: string;
  durationSec?: number | null;
  publishedAt?: Date;
};

type Entry = { path: string; lastmod?: Date; priority?: number; changefreq?: string; images?: string[]; videos?: VideoEntry[] };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function videoTag(v: VideoEntry) {
  const parts = [
    `<video:thumbnail_loc>${esc(v.thumbnail)}</video:thumbnail_loc>`,
    `<video:title>${esc(v.title.slice(0, 100))}</video:title>`,
    `<video:description>${esc(v.description.slice(0, 2048))}</video:description>`,
    v.contentLoc ? `<video:content_loc>${esc(v.contentLoc)}</video:content_loc>` : "",
    v.playerLoc ? `<video:player_loc>${esc(v.playerLoc)}</video:player_loc>` : "",
    v.durationSec ? `<video:duration>${Math.min(28800, Math.max(1, Math.round(v.durationSec)))}</video:duration>` : "",
    v.publishedAt ? `<video:publication_date>${v.publishedAt.toISOString()}</video:publication_date>` : "",
    "<video:family_friendly>yes</video:family_friendly>",
  ];
  return `<video:video>${parts.join("")}</video:video>`;
}

export function urlset(entries: Entry[]) {
  const body = entries
    .map((e) => {
      const imgs = (e.images ?? []).map((src) => `<image:image><image:loc>${esc(src)}</image:loc></image:image>`).join("");
      const vids = (e.videos ?? []).filter((v) => v.playerLoc || v.contentLoc).map(videoTag).join("");
      return `<url><loc>${esc(SITE_URL + (e.path === "/" ? "" : e.path))}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ""}${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ""}${e.priority !== undefined ? `<priority>${e.priority.toFixed(1)}</priority>` : ""}${imgs}${vids}</url>`;
    })
    .join("");
  return xml(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${body}</urlset>`,
  );
}

export function sitemapIndex(paths: string[]) {
  const body = paths.map((p) => `<sitemap><loc>${esc(SITE_URL + p)}</loc></sitemap>`).join("");
  return xml(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`);
}

function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
