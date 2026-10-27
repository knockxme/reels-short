import type { Metadata } from "next";
import { BLOG_INTRO, BLOG_TITLE, BlogList } from "@/components/BlogList";
import { listingMetadata, parsePage } from "@/components/Listing";

export const ensureStatic = "navigation";

export function generateStaticParams() {
  return [{ n: "2" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/page/[n]">): Promise<Metadata> {
  return listingMetadata(parsePage((await params).n, "/blog"), "/blog", BLOG_TITLE, BLOG_INTRO);
}

export default async function Page({ params }: PageProps<"/blog/page/[n]">) {
  return <BlogList page={parsePage((await params).n, "/blog")} />;
}
