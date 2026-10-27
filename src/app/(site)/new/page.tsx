import type { Metadata } from "next";
import { Listing, listingMetadata } from "@/components/Listing";
import { LISTINGS } from "@/lib/listings";

const L = LISTINGS.new;

export const metadata: Metadata = listingMetadata(1, "/new", L.title, L.intro);

export default function Page() {
  return <Listing title={L.title} intro={L.intro} basePath="/new" filter={L.filter} page={1} />;
}
