import type { Metadata } from "next";
import { Listing, listingMetadata } from "@/components/Listing";
import { TaxonomyChips } from "@/components/TaxonomyChips";
import { LISTINGS } from "@/lib/listings";

const L = LISTINGS.browse;

export const metadata: Metadata = listingMetadata(1, "/browse", L.title, L.intro);

export default function Page() {
  return <Listing title={L.title} intro={L.intro} basePath="/browse" filter={L.filter} page={1} before={<TaxonomyChips />} />;
}
