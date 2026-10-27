import { sitemapIndex } from "@/lib/sitemap";

export function GET() {
  return sitemapIndex(["/sitemaps/pages.xml", "/sitemaps/dramas.xml"]);
}
