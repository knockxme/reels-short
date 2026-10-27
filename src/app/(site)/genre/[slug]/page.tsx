import type { Metadata } from "next";
import { TaxonomyListing, taxonomyMetadata } from "@/components/TaxonomyListing";
import { taxonomyParams } from "@/lib/taxonomy-pages";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await taxonomyParams("genre")).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/genre/[slug]">): Promise<Metadata> {
  return taxonomyMetadata("genre", (await params).slug, 1);
}

export default async function Page({ params }: PageProps<"/genre/[slug]">) {
  return <TaxonomyListing kind="genre" value={(await params).slug} page={1} />;
}
