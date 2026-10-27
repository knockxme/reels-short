import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "./Logo";
import { NavLinks, NavList } from "./NavLinks";
import { BookmarkIcon, SearchIcon } from "./icons";

const nav = [
  { href: "/browse", label: "Browse" },
  { href: "/new", label: "New Releases" },
  { href: "/popular", label: "Popular" },
  { href: "/blog", label: "News" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Logo />
        <nav aria-label="Main" className="hidden flex-1 text-sm font-medium md:block">
          {/* usePathname reads the URL; the fallback keeps plain links in the static HTML. */}
          <Suspense fallback={<NavList items={nav} pathname={null} />}>
            <NavLinks items={nav} />
          </Suspense>
        </nav>
        <form action="/search" className="hidden lg:block" role="search">
          <label className="flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm ring-1 ring-line transition-shadow duration-200 focus-within:ring-2 focus-within:ring-accent">
            <SearchIcon className="size-4 shrink-0 text-muted" />
            <input
              name="q"
              type="search"
              enterKeyHint="search"
              placeholder="Search dramas, actors…"
              maxLength={80}
              className="h-full w-48 bg-transparent outline-none placeholder:text-muted focus-visible:outline-none xl:w-64"
              aria-label="Search"
            />
          </label>
        </form>
        <Link href="/search" className="ml-auto grid size-10 place-items-center rounded-full hover:bg-surface md:ml-0 lg:hidden" aria-label="Search">
          <SearchIcon className="size-5" />
        </Link>
        <Link href="/my-list" className="-ml-4 hidden size-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-text md:grid" aria-label="My List" title="My List">
          <BookmarkIcon className="size-5" />
        </Link>
      </div>
    </header>
  );
}
