import "server-only";
import { getActor, getCountry, getGenre, getTaxonomies, type DramaFilter } from "./data";
import { truncate } from "./seo";

export type TaxonomyKind = "genre" | "country" | "year" | "actor";

export type TaxonomyPage = {
  basePath: string;
  title: string;
  metaTitle: string;
  intro: string;
  filter: DramaFilter;
  crumbs: { name: string; path: string }[];
  photoUrl?: string | null;
};

const demonym: Record<string, string> = {
  "South Korea": "Korean",
  China: "Chinese",
  Japan: "Japanese",
  Thailand: "Thai",
  Taiwan: "Taiwanese",
  Philippines: "Filipino",
  "Hong Kong": "Hong Kong",
};

export async function loadTaxonomyPage(kind: TaxonomyKind, value: string): Promise<TaxonomyPage | null> {
  const basePath = `/${kind}/${value}`;
  const browse = { name: "Browse", path: "/browse" };

  if (kind === "genre") {
    const g = await getGenre(value);
    if (!g) return null;
    return {
      basePath,
      title: `${g.name} Dramas`,
      metaTitle: `Best ${g.name} Dramas to Watch Online`,
      intro:
        g.description ||
        `Watch the best ${g.name.toLowerCase()} dramas online with English subtitles. Browse Korean, Chinese, Thai and Japanese ${g.name.toLowerCase()} series and movies, sorted by latest updates.`,
      filter: { genre: value },
      crumbs: [browse, { name: g.name, path: basePath }],
    };
  }
  if (kind === "country") {
    const c = await getCountry(value);
    if (!c) return null;
    const label = demonym[c.name] ?? c.name;
    return {
      basePath,
      title: `${label} Dramas`,
      metaTitle: `Watch ${label} Dramas Online Eng Sub`,
      intro:
        c.description ||
        `Watch ${label} dramas online with English subtitles. All the latest and most popular ${label} series and movies, updated daily.`,
      filter: { country: value },
      crumbs: [browse, { name: `${label} Dramas`, path: basePath }],
    };
  }
  if (kind === "year") {
    if (!/^(19|20)\d{2}$/.test(value)) return null;
    return {
      basePath,
      title: `${value} Dramas`,
      metaTitle: `Best ${value} Dramas to Watch`,
      intro: `All dramas and movies released in ${value}. Watch the best ${value} Asian dramas online with English subtitles.`,
      filter: { year: Number(value) },
      crumbs: [browse, { name: value, path: basePath }],
    };
  }
  const a = await getActor(value);
  if (!a) return null;
  return {
    basePath,
    title: `${a.name} Dramas`,
    metaTitle: `${a.name} Dramas and Movies`,
    intro: a.bio ? truncate(a.bio, 600) : `Watch all dramas and movies starring ${a.name} online with English subtitles.`,
    filter: { actor: value, sort: "new" },
    crumbs: [{ name: a.name, path: basePath }],
    photoUrl: a.photoUrl,
  };
}

/* Values prerendered at build. Others render on first visit and are then cached. */
export async function taxonomyParams(kind: TaxonomyKind): Promise<string[]> {
  const { genres, countries, years } = await getTaxonomies();
  const values =
    kind === "genre" ? genres.map((g) => g.slug) : kind === "country" ? countries.map((c) => c.slug) : kind === "year" ? years.map(String) : [];
  return values.length ? values : [kind === "year" ? "2026" : "__placeholder__"];
}
