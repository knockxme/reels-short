import Link from "next/link";
import { getTaxonomies } from "@/lib/data";

export async function TaxonomyChips() {
  const { genres, countries, years } = await getTaxonomies();
  const chip = "inline-flex h-9 shrink-0 items-center rounded-full bg-surface px-3.5 text-xs font-semibold ring-1 ring-line hover:ring-accent";
  const rows: [string, { href: string; label: string }[]][] = [
    ["Genre", genres.filter((g) => g._count.dramas).map((g) => ({ href: `/genre/${g.slug}`, label: g.name }))],
    ["Country", countries.filter((c) => c._count.dramas).map((c) => ({ href: `/country/${c.slug}`, label: c.name }))],
    ["Year", years.slice(0, 12).map((y) => ({ href: `/year/${y}`, label: String(y) }))],
  ];
  return (
    <div className="mb-6 space-y-2">
      {rows
        .filter(([, items]) => items.length)
        .map(([label, items]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-muted">{label}</span>
            <div className="rail flex gap-2 overflow-x-auto">
              {items.map((it) => (
                <Link key={it.href} href={it.href} className={chip}>
                  {it.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
