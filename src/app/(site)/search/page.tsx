import type { Metadata } from "next";
import { Suspense } from "react";
import { DramaGrid } from "@/components/DramaGrid";
import { SearchIcon } from "@/components/icons";
import { searchDramas } from "@/lib/data";

export const metadata: Metadata = {
  title: "Search Dramas",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

async function Results({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const items = q ? await searchDramas(q) : [];
  return (
    <>
      <form action="/search" role="search" className="sticky top-14 z-20 -mx-4 bg-bg px-4 py-3">
        <label className="flex h-12 items-center gap-2 rounded-xl bg-surface px-4 ring-1 ring-line focus-within:ring-accent">
          <SearchIcon className="size-5 text-muted" />
          <input
            name="q"
            defaultValue={q}
            autoFocus={!q}
            type="search"
            enterKeyHint="search"
            placeholder="Search by title or actor"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
            aria-label="Search dramas"
          />
        </label>
      </form>
      {q ? (
        <>
          <h1 className="mb-4 mt-2 text-lg font-bold">
            {items.length} {items.length === 1 ? "result" : "results"} for “{q}”
          </h1>
          <DramaGrid items={items} />
        </>
      ) : (
        <h1 className="mt-6 text-center text-sm text-muted">Type a drama title or actor name to search.</h1>
      )}
    </>
  );
}

export default function SearchPage(props: PageProps<"/search">) {
  return (
    // min-h keeps the footer below the fold, so a different result count can't shift it into view.
    <div className="mx-auto min-h-dvh max-w-7xl px-4">
      <Suspense fallback={<SearchSkeleton />}>
        <Results {...props} />
      </Suspense>
    </div>
  );
}

// Same shape as the results view so nothing jumps when results stream in.
function SearchSkeleton() {
  return (
    <>
      <div className="-mx-4 px-4 py-3">
        <div className="h-12 rounded-xl bg-surface ring-1 ring-line" />
      </div>
      <div className="mb-4 mt-2 h-7 w-48 animate-pulse rounded bg-surface" />
      <div className="grid animate-pulse grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-surface" />
        ))}
      </div>
    </>
  );
}
