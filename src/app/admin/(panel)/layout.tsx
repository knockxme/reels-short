import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { logoutAction } from "../actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { PlayIcon } from "@/components/icons";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4">
          {/* Top row keeps "Log out" visible on every screen size; the section tabs scroll below it. */}
          <div className="flex h-14 items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 font-extrabold tracking-tight">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent-soft to-accent text-accent-ink">
                <PlayIcon className="size-4" />
              </span>
              <span className="max-sm:hidden">{SITE_NAME}</span>
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted">Admin</span>
            </Link>
            <Link href="/admin/dramas/new" className="btn btn-primary ml-auto h-9 px-3 text-sm">
              + New drama
            </Link>
            <Link href="/" target="_blank" className="btn btn-secondary h-9 px-3 text-sm max-sm:hidden">
              View site ↗
            </Link>
            <form action={logoutAction}>
              <button className="btn h-9 px-3 text-sm text-muted ring-1 ring-line hover:bg-surface hover:text-text">Log out</button>
            </form>
          </div>
          {/* usePathname reads the URL, so it must sit inside Suspense to keep the shell static. */}
          <Suspense fallback={<div className="h-[41px]" />}>
            <AdminNav />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
