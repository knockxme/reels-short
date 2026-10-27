import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "./Breadcrumbs";
import { DramaGrid } from "./DramaGrid";
import { JsonLd } from "./JsonLd";
import { Pagination, pageHref } from "./Pagination";
import { listDramas, type DramaFilter } from "@/lib/data";
import { itemListLd } from "@/lib/seo";

/* Listing pages are fully static: page 1 at /x, page N at /x/page/N (no query strings, so crawlers get clean URLs). */

export function parsePage(n: string | undefined, basePath: string) {
  if (n === undefined) return 1;
  if (n === "1") permanentRedirect(basePath);
  if (!/^\d{1,4}$/.test(n) || Number(n) < 2) notFound();
  return Number(n);
}

export function listingMetadata(page: number, basePath: string, title: string, description: string): Metadata {
  const path = pageHref(basePath, page);
  return {
    title: page > 1 ? `${title} - Page ${page}` : title,
    description,
    alternates: { canonical: path },
    robots: page > 1 ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: path },
  };
}

export async function Listing({
  title,
  intro,
  basePath,
  filter,
  page,
  crumbs,
  before,
}: {
  title: string;
  intro?: string;
  basePath: string;
  filter: DramaFilter;
  page: number;
  crumbs?: { name: string; path: string }[];
  before?: React.ReactNode;
}) {
  const { items, total, pages } = await listDramas({ ...filter, page });
  if (page > pages) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <Breadcrumbs items={crumbs ?? [{ name: title, path: basePath }]} />
      {before}
      <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
        {page > 1 && <span className="text-base font-normal text-muted"> - Page {page}</span>}
      </h1>
      {intro && page === 1 && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{intro}</p>}
      <p className="mb-6 mt-4 inline-flex rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted ring-1 ring-line">{total} titles</p>
      <DramaGrid items={items} />
      <Pagination basePath={basePath} page={page} pages={pages} />
      {items.length > 0 && <JsonLd data={itemListLd(title, items)} />}
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 pt-4">
      <div className="h-3 w-40 rounded bg-surface" />
      <div className="mt-4 h-8 w-64 rounded bg-surface" />
      <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
