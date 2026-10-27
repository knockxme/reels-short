import { getSitemapData } from "@/lib/data";
import { truncate } from "@/lib/seo";
import { urlset } from "@/lib/sitemap";
import { dramaPath } from "@/lib/site";

// One URL per title, with its poster and its full video, so titles can show up in video search.
export async function GET() {
  const { dramas } = await getSitemapData();
  return urlset(
    dramas.map((d) => {
      const video = d.episodes[0];
      const source = video?.sources[0];
      const embed = source && (source.type === "DAILYMOTION" || source.type === "IFRAME");
      return {
        path: dramaPath(d.slug),
        lastmod: d.updatedAt,
        priority: 0.9,
        images: [d.posterUrl],
        videos: source
          ? [
              {
                thumbnail: video.thumbnailUrl ?? d.posterUrl,
                title: `${d.title} full movie`,
                description: truncate(d.synopsis, 500),
                playerLoc: embed ? source.url : undefined,
                contentLoc: embed ? undefined : source.url,
                durationSec: video.durationSec,
                publishedAt: video.createdAt,
              },
            ]
          : [],
      };
    }),
  );
}
