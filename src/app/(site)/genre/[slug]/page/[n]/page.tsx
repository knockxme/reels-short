import type { Metadata } from "next";
import { parsePage } from "@/components/Listing";
import { TaxonomyListing, taxonomyMetadata } from "@/components/TaxonomyListing";
import { taxonomyParams } from "@/lib/taxonomy-pages";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await taxonomyParams("genre")).map((slug) => ({ slug, n: "2" }));
}

export async function generateMetadata({ params }: PageProps<"/genre/[slug]/page/[n]">): Promise<Metadata> {
  const { slug, n } = await params;
  return taxonomyMetadata("genre", slug, parsePage(n, `/genre/${slug}`));
}

export default async function Page({ params }: PageProps<"/genre/[slug]/page/[n]">) {
  const { slug, n } = await params;
  return <TaxonomyListing kind="genre" value={slug} page={parsePage(n, `/genre/${slug}`)} />;
}
