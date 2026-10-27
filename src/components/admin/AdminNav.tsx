"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/dramas", label: "Dramas" },
  { href: "/admin/taxonomy", label: "Genres & Countries" },
  { href: "/admin/posts", label: "Blog" },
  { href: "/admin/trash", label: "Trash" },
  { href: "/admin/security", label: "Security" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="rail -mb-px flex gap-1 overflow-x-auto text-sm">
      {items.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-2 px-3 py-2.5 font-medium transition-colors ${active ? "border-accent text-text" : "border-transparent text-muted hover:text-text"}`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
