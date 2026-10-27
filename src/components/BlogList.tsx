import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "./Breadcrumbs";
import { Pagination } from "./Pagination";
import { getPosts } from "@/lib/data";

export const BLOG_TITLE = "Drama News, Lists & Guides";
export const BLOG_INTRO = "Drama recommendations, ending explanations, release dates and the latest news from the Asian drama world.";

export async function BlogList({ page }: { page: number }) {
  const { items, pages } = await getPosts(page);
  if (page > pages) notFound();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <Breadcrumbs items={[{ name: "News", path: "/blog" }]} />
      <h1 className="text-2xl font-extrabold sm:text-3xl">
        {BLOG_TITLE}
        {page > 1 && <span className="text-base font-normal text-muted"> - Page {page}</span>}
      </h1>
      <p className="mb-6 mt-2 text-sm text-muted">{BLOG_INTRO}</p>
      {items.length === 0 && <p className="py-12 text-center text-muted">No posts yet.</p>}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="group block">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2">
                {p.coverUrl && <Image src={p.coverUrl} alt={p.title} fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover transition group-hover:scale-105" />}
              </div>
              <h2 className="mt-3 font-bold leading-snug group-hover:text-accent-soft">{p.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
              <time className="mt-1 block text-xs text-muted" dateTime={p.publishedAt.toISOString()}>
                {p.publishedAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </time>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination basePath="/blog" page={page} pages={pages} />
    </div>
  );
}
