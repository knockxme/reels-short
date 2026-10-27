"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; wideOnly?: boolean };

/** The link list itself; `pathname` is null in the static shell, so nothing is highlighted yet. */
export function NavList({ items, pathname }: { items: Item[]; pathname: string | null }) {
  return (
    <ul className="flex items-center gap-1">
      {items.map((n) => {
        const active = !!pathname?.startsWith(n.href);
        return (
          <li key={n.href} className={n.wideOnly ? "hidden lg:block" : undefined}>
            <Link
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-9 items-center rounded-lg px-3 transition-colors duration-200 ${active ? "text-text" : "text-muted hover:bg-surface hover:text-text"}`}
            >
              {n.label}
              {active && <span className="absolute inset-x-3 -bottom-[11px] h-0.5 rounded-full bg-accent" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function NavLinks({ items }: { items: Item[] }) {
  return <NavList items={items} pathname={usePathname()} />;
}
