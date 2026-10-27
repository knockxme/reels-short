import type { Metadata } from "next";
import { TaxonomyListing, taxonomyMetadata } from "@/components/TaxonomyListing";
import { taxonomyParams } from "@/lib/taxonomy-pages";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await taxonomyParams("actor")).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/actor/[slug]">): Promise<Metadata> {
  return taxonomyMetadata("actor", (await params).slug, 1);
}

export default async function Page({ params }: PageProps<"/actor/[slug]">) {
  return <TaxonomyListing kind="actor" value={(await params).slug} page={1} />;
}
