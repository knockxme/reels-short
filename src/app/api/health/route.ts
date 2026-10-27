import { prisma } from "@/lib/db";

/**
 * Liveness + database check for Docker, load balancers and uptime monitors.
 * 200 when the app can reach Postgres, 503 when it cannot. Reveals no details.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
