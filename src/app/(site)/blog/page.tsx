import type { Metadata } from "next";
import { BLOG_INTRO, BLOG_TITLE, BlogList } from "@/components/BlogList";
import { listingMetadata } from "@/components/Listing";

export const metadata: Metadata = listingMetadata(1, "/blog", BLOG_TITLE, BLOG_INTRO);

export default function Page() {
  return <BlogList page={1} />;
}
