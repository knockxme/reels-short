import type { DramaFull } from "./data";
import { absoluteUrl, dramaPath, SITE_NAME, SITE_URL } from "./site";

export function truncate(text: string, max = 158) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:\s]+$/, "")}…`;
}

/** Every title is one complete video, so titles target "full movie" searches. */
export function dramaTitle(d: Pick<DramaFull, "title" | "year" | "seoTitle">) {
  if (d.seoTitle) return d.seoTitle;
  const year = d.year ? ` (${d.year})` : "";
  return `${d.title}${year} Full Movie Eng Sub`;
}

export function dramaDescription(d: Pick<DramaFull, "synopsis" | "seoDescription" | "title">) {
  if (d.seoDescription) return d.seoDescription;
  return truncate(`Watch ${d.title} full movie online in HD with English subtitles. ${d.synopsis}`);
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/icon-512.png"),
      },
    ],
  };
}

// schema.org inLanguage expects a BCP 47 code, not a country name.
const languageByCountry: Record<string, string> = {
  "south-korea": "ko",
  korea: "ko",
  china: "zh",
  taiwan: "zh-TW",
  "hong-kong": "zh-HK",
  japan: "ja",
  thailand: "th",
  philippines: "fil",
  vietnam: "vi",
  indonesia: "id",
};

/** 5460 → "PT1H31M" (ISO 8601 duration, as schema.org and video sitemaps expect). */
export function isoDuration(sec: number | null | undefined) {
  if (!sec) return undefined;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s || (!h && !m) ? `${s}S` : ""}`;
}

/** A title page: the Movie, with the playable video on the same URL. */
export function dramaLd(d: DramaFull, embedUrl: string | undefined) {
  const url = absoluteUrl(dramaPath(d.slug));
  const description = truncate(d.synopsis, 300);
  const video = d.video
    ? {
        "@type": "VideoObject",
        "@id": `${url}#video`,
        name: `${d.title} full movie`,
        description,
        thumbnailUrl: [d.video.thumbnailUrl ?? d.posterUrl],
        uploadDate: d.video.createdAt.toISOString(),
        duration: isoDuration(d.video.durationSec),
        embedUrl,
        url,
        inLanguage: d.country ? languageByCountry[d.country.slug] : undefined,
      }
    : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    "@id": `${url}#movie`,
    name: d.title,
    alternateName: d.altTitles.length ? d.altTitles : undefined,
    url,
    image: d.posterUrl,
    description,
    genre: d.genres.map((g) => g.name),
    inLanguage: d.country ? languageByCountry[d.country.slug] : undefined,
    countryOfOrigin: d.country ? { "@type": "Country", name: d.country.name } : undefined,
    duration: isoDuration(d.video?.durationSec),
    actor: d.actors.slice(0, 10).map((a) => ({ "@type": "Person", name: a.name, url: absoluteUrl(`/actor/${a.slug}`) })),
    datePublished: d.year ? String(d.year) : undefined,
    dateModified: d.updatedAt.toISOString(),
    video,
    potentialAction: video ? { "@type": "WatchAction", target: { "@type": "EntryPoint", urlTemplate: url } } : undefined,
  };
}

export function itemListLd(name: string, items: { slug: string; title: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(dramaPath(it.slug)),
      name: it.title,
    })),
  };
}
