import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-6xl font-extrabold text-accent-soft">404</p>
        <h1 className="mt-3 text-xl font-bold">This page could not be found</h1>
        <p className="mt-2 text-sm text-muted">This drama may have been moved or removed.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-bold text-accent-ink">Go home</Link>
          <Link href="/search" className="flex h-11 items-center rounded-lg bg-surface px-5 text-sm font-semibold ring-1 ring-line">Search</Link>
        </div>
      </div>
    </main>
  );
}
