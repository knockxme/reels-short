"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon, ClockIcon, GridIcon, HomeIcon, SearchIcon } from "./icons";

const items = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/browse", label: "Browse", Icon: GridIcon },
  { href: "/new", label: "New", Icon: ClockIcon },
  { href: "/search", label: "Search", Icon: SearchIcon },
  { href: "/my-list", label: "My List", Icon: BookmarkIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mobile"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg/95 backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${active ? "text-text" : "text-muted"}`}
                aria-current={active ? "page" : undefined}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-200 ${active ? "bg-accent/20 text-accent-soft" : ""}`}>
                  <Icon className="size-5" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
