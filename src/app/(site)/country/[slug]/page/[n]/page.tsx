import type { Metadata } from "next";
import { parsePage } from "@/components/Listing";
import { TaxonomyListing, taxonomyMetadata } from "@/components/TaxonomyListing";
import { taxonomyParams } from "@/lib/taxonomy-pages";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await taxonomyParams("country")).map((slug) => ({ slug, n: "2" }));
}

export async function generateMetadata({ params }: PageProps<"/country/[slug]/page/[n]">): Promise<Metadata> {
  const { slug, n } = await params;
  return taxonomyMetadata("country", slug, parsePage(n, `/country/${slug}`));
}

export default async function Page({ params }: PageProps<"/country/[slug]/page/[n]">) {
  const { slug, n } = await params;
  return <TaxonomyListing kind="country" value={slug} page={parsePage(n, `/country/${slug}`)} />;
}
