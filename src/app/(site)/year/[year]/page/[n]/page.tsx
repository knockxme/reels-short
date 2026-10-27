import type { Metadata } from "next";
import { parsePage } from "@/components/Listing";
import { TaxonomyListing, taxonomyMetadata } from "@/components/TaxonomyListing";
import { taxonomyParams } from "@/lib/taxonomy-pages";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await taxonomyParams("year")).map((year) => ({ year, n: "2" }));
}

export async function generateMetadata({ params }: PageProps<"/year/[year]/page/[n]">): Promise<Metadata> {
  const { year, n } = await params;
  return taxonomyMetadata("year", year, parsePage(n, `/year/${year}`));
}

export default async function Page({ params }: PageProps<"/year/[year]/page/[n]">) {
  const { year, n } = await params;
  return <TaxonomyListing kind="year" value={year} page={parsePage(n, `/year/${year}`)} />;
}
