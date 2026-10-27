import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { SITE_NAME } from "@/lib/site";

const CONTACT = process.env.CONTACT_EMAIL ?? "contact@example.com";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact the ${SITE_NAME} team to report a broken video, request a drama or send feedback. We reply to every message.`,
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return <StaticPage title="Contact Us" path="/contact" body={`We read every message. For broken videos, please include the drama name or page link so we can fix it quickly.

**Email:** ${CONTACT}

For copyright notices please follow our [DMCA policy](/dmca).`} />;
}
