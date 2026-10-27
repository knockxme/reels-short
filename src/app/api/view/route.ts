import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

/** Only count views sent by our own pages, so other sites can't inflate the counts. */
function fromOurSite(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = new URL(origin).host;
    return host === request.headers.get("host") || host === new URL(SITE_URL).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!fromOurSite(request)) return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 1024) return new Response(null, { status: 413 });

  let slug = "";
  try {
    slug = String((await request.json())?.slug ?? "");
  } catch {}
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return new Response(null, { status: 400 });
  await prisma.drama.updateMany({ where: { slug }, data: { views: { increment: 1 } } });
  return new Response(null, { status: 204 });
}
