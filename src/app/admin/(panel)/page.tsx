import Link from "next/link";
import { moveFeatured } from "../actions";
import { Card } from "@/components/admin/fields";
import { LocalTime } from "@/components/admin/LocalTime";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const nf = new Intl.NumberFormat("en-US");

export default async function Dashboard() {
  await requireAdmin();
  const alive = { deletedAt: null };
  const [dramas, drafts, missingVideo, sources, posts, views, trashed, dead, noSource, recent, topViewed, slider] = await Promise.all([
    prisma.drama.count({ where: alive }),
    prisma.drama.count({ where: { ...alive, published: false } }),
    prisma.drama.count({ where: { ...alive, episodes: { none: { ...alive, sources: { some: { isActive: true } } } } } }),
    prisma.source.count({ where: { isActive: true, episode: { ...alive, drama: alive } } }),
    prisma.post.count({ where: alive }),
    prisma.drama.aggregate({ where: alive, _sum: { views: true } }),
    Promise.all([prisma.drama.count({ where: { deletedAt: { not: null } } }), prisma.episode.count({ where: { deletedAt: { not: null } } }), prisma.post.count({ where: { deletedAt: { not: null } } })]),
    prisma.source.findMany({
      // Dead Dailymotion videos are switched off automatically, so they are listed even when inactive.
      where: {
        episode: { ...alive, drama: alive },
        OR: [
          { isActive: true, OR: [{ lastStatus: 0 }, { lastStatus: { gte: 400 } }] },
          { type: "DAILYMOTION", isActive: false, lastStatus: { gte: 400 } },
        ],
      },
      take: 30,
      orderBy: { lastCheckedAt: "desc" },
      select: { id: true, label: true, type: true, lastStatus: true, episode: { select: { dramaId: true, drama: { select: { title: true } } } } },
    }),
    prisma.drama.findMany({
      where: { ...alive, episodes: { none: { ...alive, sources: { some: { isActive: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { id: true, title: true, published: true },
    }),
    prisma.drama.findMany({ where: alive, orderBy: { updatedAt: "desc" }, take: 8, select: { id: true, title: true, updatedAt: true, published: true } }),
    prisma.drama.findMany({ where: alive, orderBy: { views: "desc" }, take: 8, select: { id: true, title: true, views: true, published: true } }),
    prisma.drama.findMany({
      where: { ...alive, featured: true },
      orderBy: [{ featuredOrder: "asc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, published: true },
    }),
  ]);
  const trashCount = trashed.reduce((a, b) => a + b, 0);

  const stats: [string, string, string?][] = [
    ["Dramas", nf.format(dramas), drafts ? `${drafts} draft${drafts === 1 ? "" : "s"}` : undefined],
    ["Missing video", nf.format(missingVideo)],
    ["Total views", nf.format(views._sum.views ?? 0)],
    ["Active sources", nf.format(sources)],
    ["Blog posts", nf.format(posts)],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(([label, n, sub]) => (
          <div key={label} className="rounded-xl bg-surface p-4 ring-1 ring-line">
            <p className="text-2xl font-extrabold tabular-nums">{n}</p>
            <p className="text-xs text-muted">
              {label}
              {sub && <span className="text-gold"> · {sub}</span>}
            </p>
          </div>
        ))}
      </div>
      {trashCount > 0 && (
        <p className="text-sm text-muted">
          {trashCount} item{trashCount === 1 ? "" : "s"} in the{" "}
          <Link href="/admin/trash" className="text-accent-soft underline">
            trash
          </Link>
          .
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Most watched" id="views">
          {topViewed.length === 0 ? (
            <p className="text-sm text-muted">No dramas yet.</p>
          ) : (
            <ol className="divide-y divide-line text-sm">
              {topViewed.map((d, i) => (
                <li key={d.id} className="flex items-center gap-3 py-2">
                  <span className="w-5 text-right text-xs font-bold text-muted tabular-nums">{i + 1}</span>
                  <Link href={`/admin/dramas/${d.id}`} className="min-w-0 flex-1 truncate hover:text-accent-soft">
                    {d.title}
                    {!d.published && <span className="ml-1 text-xs text-gold">draft</span>}
                  </Link>
                  <span className="text-xs text-muted tabular-nums">{nf.format(d.views)} views</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title={`Homepage slider (${slider.length})`} id="slider">
          {slider.length === 0 ? (
            <p className="text-sm text-muted">No featured dramas. Tick “Featured on home slider” on a drama to add it.</p>
          ) : (
            <ol className="divide-y divide-line text-sm">
              {slider.map((d, i) => (
                <li key={d.id} className="flex items-center gap-2 py-1.5">
                  <span className="w-5 text-right text-xs font-bold text-muted tabular-nums">{i + 1}</span>
                  <Link href={`/admin/dramas/${d.id}`} className="min-w-0 flex-1 truncate hover:text-accent-soft">
                    {d.title}
                    {!d.published && <span className="ml-1 text-xs text-gold">draft · hidden</span>}
                  </Link>
                  {(["up", "down"] as const).map((dir) => (
                    <form key={dir} action={moveFeatured}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="dir" value={dir} />
                      <button
                        disabled={dir === "up" ? i === 0 : i === slider.length - 1}
                        aria-label={`Move ${d.title} ${dir}`}
                        className="grid size-9 place-items-center rounded-lg text-muted ring-1 ring-line hover:bg-surface-2 hover:text-text disabled:opacity-30"
                      >
                        {dir === "up" ? "↑" : "↓"}
                      </button>
                    </form>
                  ))}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card title={`Broken sources (${dead.length})`}>
        {dead.length === 0 ? (
          <p className="text-sm text-muted">No broken links found. Run the link checker cron to refresh (see README).</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {dead.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                <Link href={`/admin/dramas/${s.episode.dramaId}#video`} className="min-w-0 truncate hover:text-accent-soft">
                  {s.episode.drama.title} · {s.label}
                </Link>
                <span className="shrink-0 text-red-400">{s.lastStatus === 410 && s.type === "DAILYMOTION" ? "removed / not embeddable" : s.lastStatus || "timeout"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {noSource.length > 0 && (
        <Card title={`Titles without a working video (${noSource.length})`}>
          <ul className="divide-y divide-line text-sm">
            {noSource.map((d) => (
              <li key={d.id} className="py-2">
                <Link href={`/admin/dramas/${d.id}#video`} className="hover:text-accent-soft">
                  {d.title}
                  {!d.published && <span className="ml-1 text-xs text-gold">draft</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Recently updated">
        <ul className="divide-y divide-line text-sm">
          {recent.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2">
              <Link href={`/admin/dramas/${d.id}`} className="min-w-0 truncate hover:text-accent-soft">{d.title}</Link>
              <span className="shrink-0 text-xs text-muted">
                {d.published ? "" : "Draft · "}
                <LocalTime date={d.updatedAt} />
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
