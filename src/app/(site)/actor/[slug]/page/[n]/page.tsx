import type { Metadata } from "next";
import { parsePage } from "@/components/Listing";
import { TaxonomyListing, taxonomyMetadata } from "@/components/TaxonomyListing";
import { taxonomyParams } from "@/lib/taxonomy-pages";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await taxonomyParams("actor")).map((slug) => ({ slug, n: "2" }));
}

export async function generateMetadata({ params }: PageProps<"/actor/[slug]/page/[n]">): Promise<Metadata> {
  const { slug, n } = await params;
  return taxonomyMetadata("actor", slug, parsePage(n, `/actor/${slug}`));
}

export default async function Page({ params }: PageProps<"/actor/[slug]/page/[n]">) {
  const { slug, n } = await params;
  return <TaxonomyListing kind="actor" value={slug} page={parsePage(n, `/actor/${slug}`)} />;
}
