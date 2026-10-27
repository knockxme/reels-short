import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms of use for ${SITE_NAME}: rules for using the site, third-party video servers, copyright and changes to these terms.`,
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <StaticPage title="Terms of Use" path="/terms" body={`By using ${SITE_NAME} you agree to these terms.

## Use of the site

The site is provided for personal, non-commercial viewing. You may not scrape, copy or redistribute the site or its content.

## Content

Videos are hosted on third-party servers. We are not responsible for the content, availability or advertising of external servers. See our [DMCA policy](/dmca) for copyright concerns.

## Changes

We may update these terms at any time. Continued use of the site means you accept the updated terms.`} />;
}
