import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { preconnect } from "react-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DramaCard } from "@/components/DramaCard";
import { JsonLd } from "@/components/JsonLd";
import { MyListButton } from "@/components/MyListButton";
import { Player } from "@/components/Player";
import { Rail } from "@/components/Rail";
import { ShareButton } from "@/components/ShareButton";
import { ClockIcon, StarIcon } from "@/components/icons";
import { getDrama, getRelatedDramas, getTopDramaSlugs } from "@/lib/data";
import { dramaDescription, dramaLd, dramaTitle } from "@/lib/seo";
import { dramaPath, formatDuration } from "@/lib/site";

// First visit to an unlisted slug waits for the full page, so crawlers always get complete HTML and real 404s.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const top = await getTopDramaSlugs();
  return top.length ? top.map((d) => ({ slug: d.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/drama/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const drama = await getDrama(slug);
  if (!drama) return {};
  const title = dramaTitle(drama);
  const description = dramaDescription(drama);
  return {
    title,
    description,
    alternates: { canonical: dramaPath(slug) },
    openGraph: {
      type: "video.movie",
      title,
      description,
      url: dramaPath(slug),
      images: [{ url: drama.posterUrl, alt: drama.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [drama.posterUrl] },
  };
}

export default async function DramaPage({ params }: PageProps<"/drama/[slug]">) {
  const { slug } = await params;
  const drama = await getDrama(slug);
  if (!drama) notFound();

  const related = await getRelatedDramas(drama.id, drama.genres.map((g) => g.id), drama.countryId);
  const video = drama.video;
  const duration = formatDuration(video?.durationSec);
  const embedUrl = video?.sources.find((s) => s.type === "DAILYMOTION" || s.type === "IFRAME")?.url;

  // Warm up the video host's connection so playback starts sooner.
  const firstSource = video?.sources[0]?.url;
  if (firstSource) {
    try {
      preconnect(new URL(firstSource).origin);
    } catch {}
  }

  const facts: [string, React.ReactNode][] = [
    ["Country", drama.country ? <Link href={`/country/${drama.country.slug}`} className="hover:text-accent-soft">{drama.country.name}</Link> : null],
    ["Year", drama.year ? <Link href={`/year/${drama.year}`} className="hover:text-accent-soft">{drama.year}</Link> : null],
    ["Length", duration],
    ["Network", drama.network],
    ["Also known as", drama.altTitles.length ? drama.altTitles.join(", ") : null],
  ];

  return (
    <article>
      <div className="relative">
        {/* Blurred poster wash behind the player and details. */}
        <div className="absolute inset-0 -z-10 h-[34rem] overflow-hidden" aria-hidden>
          <Image src={drama.posterUrl} alt="" fill sizes="100vw" className="scale-125 object-cover opacity-30 blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-bg/10 via-bg/70 to-bg" />
        </div>

        <div className="mx-auto max-w-6xl sm:px-4 sm:pt-4">
          <div className="px-4 pt-3 sm:px-0 sm:pt-0">
            <Breadcrumbs
              items={[
                ...(drama.country ? [{ name: `${drama.country.name} Dramas`, path: `/country/${drama.country.slug}` }] : []),
                { name: drama.title, path: dramaPath(drama.slug) },
              ]}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-10">
            <div className="lg:sticky lg:top-20 lg:self-start">
              <Player
                sources={video?.sources ?? []}
                poster={drama.posterUrl}
                drama={{ slug: drama.slug, title: drama.title, poster: drama.posterUrl }}
                title={`${drama.title} full movie`}
              />
            </div>

            <div className="min-w-0 px-4 sm:px-0">
              <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                {drama.title}
                {drama.year ? <span className="font-semibold text-muted"> ({drama.year})</span> : null}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {drama.rating ? (
                  <span className="flex h-9 items-center gap-1 rounded-full bg-gold/10 px-3 text-sm font-bold text-gold ring-1 ring-gold/30">
                    <StarIcon className="size-4" /> {drama.rating.toFixed(1)}
                  </span>
                ) : null}
                {duration && (
                  <span className="flex h-9 items-center gap-1.5 rounded-full bg-surface px-3 text-sm font-semibold ring-1 ring-line">
                    <ClockIcon className="size-4 text-muted" /> {duration}
                  </span>
                )}
                {drama.genres.map((g) => (
                  <Link key={g.id} href={`/genre/${g.slug}`} className="chip">
                    {g.name}
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MyListButton slug={drama.slug} title={drama.title} poster={drama.posterUrl} />
                <ShareButton title={drama.title} />
              </div>

              <section className="mt-8">
                <h2 className="section-title mb-3">{drama.title} Story</h2>
                <div className="prose-drama">
                  {drama.synopsis.split(/\n{2,}/).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>

              {facts.some(([, v]) => v) && (
                <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 rounded-2xl bg-surface/70 p-4 text-sm ring-1 ring-line/70">
                  {facts
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-muted">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                </dl>
              )}

              {drama.actors.length > 0 && (
                <section className="mt-8">
                  <h2 className="section-title mb-4">Cast</h2>
                  <ul className="rail -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                    {drama.actors.map((a) => (
                      <li key={a.id} className="w-20 shrink-0 text-center">
                        <Link href={`/actor/${a.slug}`} className="group block">
                          <div className="relative mx-auto size-16 overflow-hidden rounded-full bg-surface-2 ring-2 ring-line transition-shadow duration-200 group-hover:ring-accent">
                            {a.photoUrl ? (
                              <Image src={a.photoUrl} alt={a.name} fill sizes="64px" className="object-cover" />
                            ) : (
                              <span className="grid h-full place-items-center text-lg font-bold text-muted">{a.name[0]}</span>
                            )}
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs font-medium transition-colors group-hover:text-accent-soft">{a.name}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <Rail title="You May Also Like">
          {related.map((d) => <DramaCard key={d.id} drama={d} />)}
        </Rail>
      )}

      <JsonLd data={dramaLd(drama, embedUrl)} />
    </article>
  );
}
