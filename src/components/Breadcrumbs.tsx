import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-3 overflow-hidden py-1 text-xs text-muted">
        <ol className="flex items-center gap-1 whitespace-nowrap">
          {all.map((it, i) => (
            <li key={it.path} className="flex min-w-0 items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className="truncate text-text/80">{it.name}</span>
              ) : (
                <Link href={it.path} className="-my-2 inline-block py-2 transition-colors hover:text-accent-soft">{it.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(all)} />
    </>
  );
}
