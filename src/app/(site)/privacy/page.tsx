import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { SITE_NAME } from "@/lib/site";

const CONTACT = process.env.CONTACT_EMAIL ?? "contact@example.com";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `${SITE_NAME} privacy policy: no account needed, watch history stays in your browser, and how cookies and video servers are used.`,
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return <StaticPage title="Privacy Policy" path="/privacy" body={`## Information we collect

We do not require an account. Your watch history and My List are stored only in your own browser (localStorage) and never sent to our servers.

## Cookies and analytics

We may use privacy-friendly analytics and advertising partners that set their own cookies to measure traffic and show ads. You can block or delete cookies in your browser settings at any time.

## Third-party video players

Videos are played from third-party servers. Those servers may collect technical data such as your IP address under their own privacy policies.

## Contact

Questions about this policy: ${CONTACT}`} />;
}
