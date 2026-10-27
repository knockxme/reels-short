import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/data";
import { isCronAuthorized } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { checkDmSources } from "@/lib/dm-sync";
import { parseSourceInput } from "@/lib/source";

/*
 * Checks every active source and records its HTTP status, so dead links show up in /admin.
 * Dailymotion videos are checked through the Dailymotion API; dead ones are hidden from viewers.
 * Call daily from cron: curl -H "Authorization: Bearer $CRON_SECRET" https://yoursite.com/api/cron/check-links
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sources = await prisma.source.findMany({
    where: { isActive: true, type: { not: "DAILYMOTION" } },
    orderBy: { lastCheckedAt: { sort: "asc", nulls: "first" } },
    take: 500,
    select: { id: true, url: true },
  });

  let dead = 0;
  const queue = [...sources];
  async function worker() {
    for (let s = queue.shift(); s; s = queue.shift()) {
      let status = 0;
      // Re-check stored URLs (older rows predate the private-address rule) and never follow
      // redirects, which could bounce the request to an internal address.
      if ("error" in parseSourceInput(s.url)) {
        await prisma.source.update({ where: { id: s.id }, data: { lastStatus: 0, lastCheckedAt: new Date() } });
        dead++;
        continue;
      }
      try {
        const res = await fetch(s.url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(10000), headers: { Range: "bytes=0-1024" } });
        status = res.status;
        await res.body?.cancel();
      } catch {
        status = 0;
      }
      if (status === 0 || status >= 400) dead++;
      await prisma.source.update({ where: { id: s.id }, data: { lastStatus: status, lastCheckedAt: new Date() } });
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));

  let dailymotion: Awaited<ReturnType<typeof checkDmSources>> | { error: string };
  try {
    dailymotion = await checkDmSources();
    for (const slug of dailymotion.changed) revalidateTag(TAGS.drama(slug), { expire: 0 });
    if (dailymotion.changed.length) revalidateTag(TAGS.dramas, { expire: 0 });
  } catch (err) {
    dailymotion = { error: err instanceof Error ? err.message : String(err) };
  }
  return Response.json({ checked: sources.length, dead, dailymotion });
}
