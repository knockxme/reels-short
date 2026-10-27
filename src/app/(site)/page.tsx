import type { Metadata } from "next";
import Link from "next/link";
import { ContinueWatching } from "@/components/ContinueWatching";
import { DramaCard } from "@/components/DramaCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { Rail } from "@/components/Rail";
import { getHomeData } from "@/lib/data";
import { formatDuration, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const { featured, trending, recent, topRated, genres } = await getHomeData();

  const hero = featured.map((d) => ({
    slug: d.slug,
    title: d.title,
    synopsis: d.synopsis,
    poster: d.posterUrl,
    meta: [d.country?.name, d.year, formatDuration(d.episodes[0]?.durationSec)].filter(Boolean).join(" · "),
    rating: d.rating,
    genres: d.genres.map((g) => g.name),
  }));

  return (
    <>
      {hero.length ? (
        <HeroCarousel items={hero} />
      ) : (
        <h1 className="mx-auto max-w-7xl px-4 pt-8 text-3xl font-extrabold tracking-tight">{SITE_TAGLINE}</h1>
      )}

      <ContinueWatching />

      {trending.length > 0 && (
        <Rail title="Trending Now" href="/popular">
          {trending.map((d, i) => <DramaCard key={d.id} drama={d} priority={!hero.length && i < 3} />)}
        </Rail>
      )}
      {recent.length > 0 && (
        <Rail title="New Releases" href="/new">
          {recent.map((d) => <DramaCard key={d.id} drama={d} />)}
        </Rail>
      )}
      {topRated.length > 0 && (
        <Rail title="Top Rated" href="/browse">
          {topRated.map((d) => <DramaCard key={d.id} drama={d} />)}
        </Rail>
      )}

      {genres.length > 0 && (
        <section className="mx-auto mt-12 max-w-7xl px-4">
          <h2 className="section-title mb-4">Browse by Genre</h2>
          <ul className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <li key={g.slug}>
                <Link href={`/genre/${g.slug}`} className="chip h-10 px-4 text-sm">
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto mt-14 max-w-7xl px-4">
        <div className="max-w-3xl rounded-2xl bg-surface/60 p-5 text-sm leading-relaxed text-muted ring-1 ring-line/70 sm:p-6">
          <h2 className="mb-2 text-base font-semibold text-text">Watch full short dramas online on {SITE_NAME}</h2>
          <p>
            {SITE_NAME} brings you complete Korean, Chinese, Thai and Japanese short dramas with English subtitles. Every
            story plays from start to finish in one vertical video, made for your phone, with no waiting for the next
            episode. Pick up where you left off with Continue Watching, save titles to My List, and switch servers in one tap
            if a video is slow.
          </p>
        </div>
      </section>
    </>
  );
}
