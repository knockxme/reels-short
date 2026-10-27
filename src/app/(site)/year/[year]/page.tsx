import type { Metadata } from "next";
import { TaxonomyListing, taxonomyMetadata } from "@/components/TaxonomyListing";
import { taxonomyParams } from "@/lib/taxonomy-pages";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await taxonomyParams("year")).map((year) => ({ year }));
}

export async function generateMetadata({ params }: PageProps<"/year/[year]">): Promise<Metadata> {
  return taxonomyMetadata("year", (await params).year, 1);
}

export default async function Page({ params }: PageProps<"/year/[year]">) {
  return <TaxonomyListing kind="year" value={(await params).year} page={1} />;
}
