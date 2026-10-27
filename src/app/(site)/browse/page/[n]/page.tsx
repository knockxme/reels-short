import type { Metadata } from "next";
import { Listing, listingMetadata, parsePage } from "@/components/Listing";
import { LISTINGS } from "@/lib/listings";

const L = LISTINGS.browse;
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return [{ n: "2" }];
}

export async function generateMetadata({ params }: PageProps<"/browse/page/[n]">): Promise<Metadata> {
  return listingMetadata(parsePage((await params).n, "/browse"), "/browse", L.title, L.intro);
}

export default async function Page({ params }: PageProps<"/browse/page/[n]">) {
  const page = parsePage((await params).n, "/browse");
  return <Listing title={L.title} intro={L.intro} basePath="/browse" filter={L.filter} page={page} />;
}
