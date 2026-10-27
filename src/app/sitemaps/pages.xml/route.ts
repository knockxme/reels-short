import { getSitemapData } from "@/lib/data";
import { urlset } from "@/lib/sitemap";

export async function GET() {
  const { genres, countries, actors, posts } = await getSitemapData();
  return urlset([
    { path: "/", priority: 1, changefreq: "daily" },
    ...["/browse", "/new", "/popular", "/blog"].map((path) => ({ path, priority: 0.8, changefreq: "daily" })),
    ...genres.map((g) => ({ path: `/genre/${g.slug}`, priority: 0.7, changefreq: "daily" })),
    ...countries.map((c) => ({ path: `/country/${c.slug}`, priority: 0.7, changefreq: "daily" })),
    ...actors.map((a) => ({ path: `/actor/${a.slug}`, priority: 0.4 })),
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, lastmod: p.updatedAt, priority: 0.6 })),
    ...["/about", "/contact", "/dmca", "/privacy", "/terms"].map((path) => ({ path, priority: 0.2 })),
  ]);
}
