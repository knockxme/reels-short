import type { Metadata } from "next";
import { TaxonomyListing, taxonomyMetadata } from "@/components/TaxonomyListing";
import { taxonomyParams } from "@/lib/taxonomy-pages";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await taxonomyParams("country")).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/country/[slug]">): Promise<Metadata> {
  return taxonomyMetadata("country", (await params).slug, 1);
}

export default async function Page({ params }: PageProps<"/country/[slug]">) {
  return <TaxonomyListing kind="country" value={(await params).slug} page={1} />;
}
