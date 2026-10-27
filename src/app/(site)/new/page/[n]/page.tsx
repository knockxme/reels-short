import type { Metadata } from "next";
import { Listing, listingMetadata, parsePage } from "@/components/Listing";
import { LISTINGS } from "@/lib/listings";

const L = LISTINGS.new;
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return [{ n: "2" }];
}

export async function generateMetadata({ params }: PageProps<"/new/page/[n]">): Promise<Metadata> {
  return listingMetadata(parsePage((await params).n, "/new"), "/new", L.title, L.intro);
}

export default async function Page({ params }: PageProps<"/new/page/[n]">) {
  const page = parsePage((await params).n, "/new");
  return <Listing title={L.title} intro={L.intro} basePath="/new" filter={L.filter} page={page} />;
}
