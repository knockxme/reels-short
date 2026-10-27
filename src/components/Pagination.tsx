import Link from "next/link";
import { ChevronLeft, ChevronRight } from "./icons";

export function pageHref(basePath: string, page: number) {
  return page > 1 ? `${basePath}/page/${page}` : basePath;
}

export function Pagination({ basePath, page, pages }: { basePath: string; page: number; pages: number }) {
  if (pages <= 1) return null;
  const nums = Array.from(new Set([1, page - 1, page, page + 1, pages])).filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const cls = "grid h-11 min-w-11 place-items-center rounded-xl px-3 text-sm font-semibold tabular-nums transition-colors duration-200";
  const idle = "bg-surface ring-1 ring-line hover:bg-surface-2 hover:text-accent-soft";
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link rel="prev" href={pageHref(basePath, page - 1)} className={`${cls} ${idle} flex gap-1`}>
          <ChevronLeft className="size-4" /> Prev
        </Link>
      )}
      {nums.map((n, i) => (
        <span key={n} className="contents">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-muted" aria-hidden>…</span>}
          <Link
            href={pageHref(basePath, n)}
            aria-current={n === page ? "page" : undefined}
            aria-label={`Page ${n}`}
            className={`${cls} ${n === page ? "bg-accent text-accent-ink shadow-md shadow-accent/30" : idle}`}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link rel="next" href={pageHref(basePath, page + 1)} className={`${cls} ${idle} flex gap-1`}>
          Next <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
