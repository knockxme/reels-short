import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { SITE_NAME } from "@/lib/site";

const CONTACT = process.env.CONTACT_EMAIL ?? "contact@example.com";

export const metadata: Metadata = {
  title: "DMCA Policy",
  description: `${SITE_NAME} DMCA policy: how copyright owners can send a takedown notice and how we handle removal requests within 48 hours.`,
  alternates: { canonical: "/dmca" },
};

export default function Page() {
  return <StaticPage title="DMCA Policy" path="/dmca" body={`${SITE_NAME} respects the intellectual property rights of others. If you believe that content available on this site infringes your copyright, send a notice to **${CONTACT}** containing:

- Identification of the copyrighted work you claim has been infringed
- The exact URL(s) on this site where the material appears
- Your name, address, telephone number and email address
- A statement that you have a good-faith belief that the use is not authorised by the copyright owner, its agent or the law
- A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorised to act on their behalf
- Your physical or electronic signature

We will review valid notices and remove or disable access to the material within 48 hours.`} />;
}
