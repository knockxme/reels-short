import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Listing, listingMetadata } from "./Listing";
import { loadTaxonomyPage, type TaxonomyKind } from "@/lib/taxonomy-pages";

export async function taxonomyMetadata(kind: TaxonomyKind, value: string, page: number): Promise<Metadata> {
  const t = await loadTaxonomyPage(kind, value);
  return t ? listingMetadata(page, t.basePath, t.metaTitle, t.intro) : {};
}

export async function TaxonomyListing({ kind, value, page }: { kind: TaxonomyKind; value: string; page: number }) {
  const t = await loadTaxonomyPage(kind, value);
  if (!t) notFound();
  return (
    <Listing
      title={t.title}
      intro={t.intro}
      basePath={t.basePath}
      filter={t.filter}
      page={page}
      crumbs={t.crumbs}
      before={
        t.photoUrl ? (
          <div className="relative mb-4 size-24 overflow-hidden rounded-full ring-2 ring-accent">
            <Image src={t.photoUrl} alt={t.title} fill sizes="96px" className="object-cover" priority />
          </div>
        ) : null
      }
    />
  );
}
