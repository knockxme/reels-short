import Image from "next/image";
import Link from "next/link";
import { deleteDramas } from "../../actions";
import type { Prisma } from "@/generated/prisma/client";
import { Notice } from "@/components/admin/ActionForm";
import { AutoSubmitSelect } from "@/components/admin/AutoSubmitSelect";
import { BulkBar, BulkCheck } from "@/components/admin/BulkSelect";
import { inputCls } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDuration } from "@/lib/site";

const PAGE = 50;
const nf = new Intl.NumberFormat("en-US");

const filters: Record<string, [label: string, where: Prisma.DramaWhereInput]> = {
  all: ["All dramas", {}],
  published: ["Published", { published: true }],
  draft: ["Drafts", { published: false }],
  featured: ["In slider", { featured: true }],
  "no-video": ["No video", { episodes: { none: { deletedAt: null, sources: { some: {} } } } }],
  broken: ["Video not working", { episodes: { some: { deletedAt: null, sources: { some: {} } } }, NOT: { episodes: { some: { deletedAt: null, sources: { some: { isActive: true, OR: [{ lastStatus: null }, { lastStatus: { gt: 0, lt: 400 } }] } } } } } }],
};

const sorts: Record<string, [label: string, orderBy: Prisma.DramaOrderByWithRelationInput]> = {
  updated: ["Recently updated", { updatedAt: "desc" }],
  newest: ["Newest first", { createdAt: "desc" }],
  views: ["Most viewed", { views: "desc" }],
  title: ["Title A–Z", { title: "asc" }],
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminDramas({ searchParams }: PageProps<"/admin/dramas">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  const filter = one(sp.filter) in filters ? one(sp.filter) : "all";
  const sort = one(sp.sort) in sorts ? one(sp.sort) : "updated";
  const page = Math.max(1, Math.min(10_000, Number(one(sp.page)) || 1));
  const where: Prisma.DramaWhereInput = {
    deletedAt: null,
    ...filters[filter][1],
    ...(q && { title: { contains: q, mode: "insensitive" } }),
  };
  const [items, total] = await Promise.all([
    prisma.drama.findMany({
      where,
      orderBy: [sorts[sort][1], { id: "desc" }],
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: {
        id: true,
        title: true,
        posterUrl: true,
        year: true,
        published: true,
        featured: true,
        views: true,
        episodes: {
          where: { deletedAt: null },
          take: 1,
          select: { durationSec: true, _count: { select: { sources: { where: { isActive: true } } } } },
        },
      },
    }),
    prisma.drama.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (p: number) => `?${new URLSearchParams({ q, filter, sort, page: String(p) })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Dramas <span className="text-base font-normal text-muted">({nf.format(total)})</span>
        </h1>
      </div>
      {sp.trashed && (
        <Notice>
          Moved to the trash. <Link href="/admin/trash" className="underline">Undo from the trash</Link> within 30 days.
        </Notice>
      )}

      <form className="flex flex-wrap gap-2" role="search">
        <label className="block w-full sm:w-auto sm:flex-1">
          <span className="sr-only">Search title</span>
          <input name="q" defaultValue={q} type="search" placeholder="Search title…" className={`${inputCls} mt-0`} />
        </label>
        <AutoSubmitSelect name="filter" label="Show" defaultValue={filter} options={Object.entries(filters).map(([k, [l]]) => [k, l])} />
        <AutoSubmitSelect name="sort" label="Sort by" defaultValue={sort} options={Object.entries(sorts).map(([k, [l]]) => [k, l])} />
        <noscript>
          <button className="btn btn-secondary">Apply</button>
        </noscript>
      </form>

      <BulkBar key={items.map((d) => d.id).join()} formId="bulk-dramas" action={deleteDramas} noun="drama" />
      <ul className="divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-line">
        {items.map((d) => (
          <li key={d.id} className="flex items-center gap-1 pl-3 transition-colors hover:bg-surface-2">
            <BulkCheck formId="bulk-dramas" id={d.id} label={d.title} />
            <Link href={`/admin/dramas/${d.id}`} className="flex min-w-0 flex-1 items-center gap-3 p-3">
              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-bg">
                <Image src={d.posterUrl} alt="" fill sizes="40px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{d.title}</p>
                <p className="flex flex-wrap gap-x-2 text-xs text-muted">
                  {d.year && <span>{d.year}</span>}
                  {d.episodes[0]?._count.sources ? (
                    <span>▶ {formatDuration(d.episodes[0].durationSec) ?? "video"}</span>
                  ) : (
                    <span className="font-semibold text-red-400">No video</span>
                  )}
                  {d.featured && <span className="text-accent-soft">★ slider</span>}
                  {!d.published && <span className="font-semibold text-gold">DRAFT</span>}
                </p>
              </div>
              <span className="shrink-0 text-right text-xs text-muted tabular-nums">
                <span className="block text-sm font-semibold text-text">{nf.format(d.views)}</span>
                views
              </span>
            </Link>
          </li>
        ))}
        {!items.length && <li className="p-6 text-center text-sm text-muted">{q || filter !== "all" ? "No dramas match these filters." : "No dramas yet."}</li>}
      </ul>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          {page > 1 ? <Link className="btn btn-secondary h-9" href={href(page - 1)}>‹ Prev</Link> : <span />}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link className="btn btn-secondary h-9" href={href(page + 1)}>Next ›</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
