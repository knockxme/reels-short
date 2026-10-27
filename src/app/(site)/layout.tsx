import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { websiteLd } from "@/lib/seo";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Header />
      <main id="main" className="min-h-[60vh] pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
      {/* Reads the URL for the active tab; it is position:fixed, so streaming it in shifts nothing. */}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
      <JsonLd data={websiteLd()} />
    </>
  );
}
