import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { Logo } from "./Logo";

const cols = [
  {
    title: "Browse",
    links: [
      ["/browse", "All Short Dramas"],
      ["/new", "New Releases"],
      ["/popular", "Popular"],
      ["/my-list", "My List"],
    ],
  },
  {
    title: "Countries",
    links: [
      ["/country/south-korea", "Korean Short Dramas"],
      ["/country/china", "Chinese Short Dramas"],
      ["/country/thailand", "Thai Short Dramas"],
      ["/country/japan", "Japanese Short Dramas"],
    ],
  },
  {
    title: "Site",
    links: [
      ["/about", "About"],
      ["/blog", "News & Lists"],
      ["/contact", "Contact"],
      ["/dmca", "DMCA"],
      ["/privacy", "Privacy"],
      ["/terms", "Terms"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line/60 bg-surface/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Full Asian short dramas with English subtitles, each one complete in a single vertical video. Built for your phone.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-text/90">{c.title}</p>
            <ul className="space-y-1 text-sm text-muted">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-8 items-center transition-colors hover:text-accent-soft">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-line/60 px-4 py-5 text-center text-xs text-muted">
        © {SITE_NAME}. All videos are hosted on third-party servers. For copyright concerns see our{" "}
        <Link href="/dmca" className="underline">
          DMCA policy
        </Link>
        .
      </p>
    </footer>
  );
}
