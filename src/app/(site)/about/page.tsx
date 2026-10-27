import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: `About ${SITE_NAME}: a mobile-first site to watch Korean, Chinese, Thai and Japanese dramas online with English subtitles.`,
  alternates: { canonical: "/about" },
};

export default function Page() {
  return <StaticPage title="About Us" path="/about" body={`${SITE_NAME} is a streaming guide for fans of Korean, Chinese, Thai and Japanese dramas. We organise every series by genre, country and year so you can find your next favourite show quickly, and we built the site mobile-first so it plays smoothly on any phone.

## What you can do here

- Watch dramas and movies with English subtitles
- Continue where you left off, on the same device, without an account
- Save shows to My List
- Read drama news, recommendations and guides on our [blog](/blog)

Questions or suggestions? [Contact us](/contact).`} />;
}
