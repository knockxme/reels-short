import "server-only";
import { prisma } from "./db";
import { checkDmVideos, parseDailymotion } from "./dailymotion";

/**
 * Re-checks every Dailymotion source. A video that was deleted, made private or had embedding
 * turned off is deactivated (status 410), which hides it from viewers. One that comes back is
 * re-activated. Sources an admin disabled by hand (status below 400) are left alone.
 * Returns the slugs of dramas whose videos changed, so the caller can refresh their cache.
 */
export async function checkDmSources() {
  const sources = await prisma.source.findMany({
    where: { type: "DAILYMOTION", OR: [{ isActive: true }, { lastStatus: { gte: 400 } }] },
    select: { id: true, url: true, isActive: true, episode: { select: { drama: { select: { slug: true } } } } },
  });
  const idOf = (url: string) => parseDailymotion(url)?.id ?? "";
  const ok = await checkDmVideos([...new Set(sources.map((s) => idOf(s.url)))]);

  const changed = new Set<string>();
  let dead = 0;
  const now = new Date();
  for (const s of sources) {
    const alive = ok.has(idOf(s.url));
    if (!alive) dead++;
    if (alive !== s.isActive) changed.add(s.episode.drama.slug);
    await prisma.source.update({
      where: { id: s.id },
      data: { isActive: alive, lastStatus: alive ? 200 : 410, lastCheckedAt: now },
    });
  }
  return { checked: sources.length, dead, changed: [...changed] };
}
