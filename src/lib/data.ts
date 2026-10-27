import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { DramaStatus, DramaType, Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import { PAGE_SIZE } from "./site";

/*
 * Cache tags are invalidated instantly from admin server actions. Lifetimes stay at "minutes" because
 * Next keeps rendered pages on disk but tag invalidations only in memory: after a server restart, any
 * stale page heals within about a minute instead of an hour.
 */
export const TAGS = {
  dramas: "dramas",
  drama: (slug: string) => `drama:${slug}`,
  taxonomy: "taxonomy",
  posts: "posts",
} as const;

/*
 * Every title is one full video. In the database that video is the title's first published
 * Episode row (number 1), which holds its sources, duration and thumbnail. Visitors never see
 * the word "episode".
 */
const videoWhere = { published: true, deletedAt: null } satisfies Prisma.EpisodeWhereInput;

export const cardSelect = {
  id: true,
  slug: true,
  title: true,
  posterUrl: true,
  year: true,
  rating: true,
  country: { select: { name: true, slug: true } },
  episodes: {
    where: videoWhere,
    orderBy: { number: "asc" },
    take: 1,
    select: { durationSec: true },
  },
} satisfies Prisma.DramaSelect;

export type DramaCardData = Prisma.DramaGetPayload<{ select: typeof cardSelect }>;

// Trashed dramas are also unpublished; deletedAt is checked too so a bad write can't leak one.
const live = { published: true, deletedAt: null } satisfies Prisma.DramaWhereInput;

export async function getHomeData() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.dramas, TAGS.taxonomy);

  const [featured, trending, recent, topRated, genres] = await Promise.all([
    prisma.drama.findMany({
      where: { ...live, featured: true },
      orderBy: [{ featuredOrder: "asc" }, { updatedAt: "desc" }],
      take: 6,
      select: {
        ...cardSelect,
        synopsis: true,
        genres: { select: { name: true, slug: true }, take: 3 },
      },
    }),
    prisma.drama.findMany({ where: live, orderBy: { views: "desc" }, take: 12, select: cardSelect }),
    prisma.drama.findMany({ where: live, orderBy: { createdAt: "desc" }, take: 12, select: cardSelect }),
    prisma.drama.findMany({
      where: { ...live, rating: { not: null } },
      orderBy: [{ rating: "desc" }, { views: "desc" }],
      take: 12,
      select: cardSelect,
    }),
    prisma.genre.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } }),
  ]);

  return { featured, trending, recent, topRated, genres };
}

export async function getDrama(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.drama(slug));

  const drama = await prisma.drama.findFirst({
    where: { slug, ...live },
    include: {
      country: true,
      genres: { orderBy: { name: "asc" } },
      actors: { orderBy: { name: "asc" } },
      episodes: {
        where: videoWhere,
        orderBy: { number: "asc" },
        take: 1,
        select: {
          id: true,
          thumbnailUrl: true,
          durationSec: true,
          createdAt: true,
          updatedAt: true,
          sources: {
            where: { isActive: true },
            orderBy: [{ priority: "asc" }, { id: "asc" }],
            select: { id: true, label: true, type: true, url: true },
          },
        },
      },
    },
  });
  if (!drama) return null;
  const { episodes, ...rest } = drama;
  return { ...rest, video: episodes[0] ?? null };
}

export type DramaFull = NonNullable<Awaited<ReturnType<typeof getDrama>>>;

export async function getRelatedDramas(dramaId: number, genreIds: number[], countryId: number | null) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.dramas);

  const related = await prisma.drama.findMany({
    where: {
      ...live,
      id: { not: dramaId },
      OR: [{ genres: { some: { id: { in: genreIds } } } }, ...(countryId ? [{ countryId }] : [])],
    },
    orderBy: { views: "desc" },
    take: 12,
    select: cardSelect,
  });
  return related;
}

export type DramaFilter = {
  genre?: string;
  country?: string;
  actor?: string;
  year?: number;
  status?: DramaStatus;
  type?: DramaType;
  sort?: "latest" | "popular" | "rating" | "title" | "new";
  page?: number;
};

export async function listDramas(filter: DramaFilter) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.dramas);

  const page = Math.max(1, filter.page ?? 1);
  const where: Prisma.DramaWhereInput = {
    ...live,
    ...(filter.genre && { genres: { some: { slug: filter.genre } } }),
    ...(filter.country && { country: { slug: filter.country } }),
    ...(filter.actor && { actors: { some: { slug: filter.actor } } }),
    ...(filter.year && { year: filter.year }),
    ...(filter.status && { status: filter.status }),
    ...(filter.type && { type: filter.type }),
  };
  const orderBy: Prisma.DramaOrderByWithRelationInput =
    filter.sort === "popular"
      ? { views: "desc" }
      : filter.sort === "rating"
        ? { rating: { sort: "desc", nulls: "last" } }
        : filter.sort === "title"
          ? { title: "asc" }
          : filter.sort === "new"
            ? { createdAt: "desc" }
            : { updatedAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.drama.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: cardSelect }),
    prisma.drama.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function searchDramas(q: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.dramas);

  const term = q.trim().slice(0, 80);
  if (term.length < 2) return [];
  return prisma.drama.findMany({
    where: {
      ...live,
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { altTitles: { has: term } },
        { actors: { some: { name: { contains: term, mode: "insensitive" } } } },
      ],
    },
    orderBy: { views: "desc" },
    take: 48,
    select: cardSelect,
  });
}

export async function getGenre(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.taxonomy);
  return prisma.genre.findUnique({ where: { slug } });
}

export async function getCountry(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.taxonomy);
  return prisma.country.findUnique({ where: { slug } });
}

export async function getActor(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.taxonomy);
  return prisma.actor.findUnique({ where: { slug } });
}

export async function getTaxonomies() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.taxonomy, TAGS.dramas);
  const [genres, countries, years] = await Promise.all([
    prisma.genre.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true, _count: { select: { dramas: { where: live } } } },
    }),
    prisma.country.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true, _count: { select: { dramas: { where: live } } } },
    }),
    prisma.drama.groupBy({ by: ["year"], where: { ...live, year: { not: null } }, orderBy: { year: "desc" } }),
  ]);
  return { genres, countries, years: years.map((y) => y.year!).filter(Boolean) };
}

export async function getPosts(page = 1) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.posts);
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { slug: true, title: true, excerpt: true, coverUrl: true, publishedAt: true },
    }),
    prisma.post.count({ where: { published: true } }),
  ]);
  return { items, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getPost(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.posts);
  return prisma.post.findFirst({ where: { slug, published: true } });
}

/* Used by generateStaticParams: prerender the most visited pages at build time. */
export async function getTopDramaSlugs(take = 50) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.dramas);
  return prisma.drama.findMany({ where: live, orderBy: { views: "desc" }, take, select: { slug: true } });
}

export async function getSitemapData() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.dramas, TAGS.taxonomy, TAGS.posts);
  const [dramas, genres, countries, actors, posts] = await Promise.all([
    prisma.drama.findMany({
      where: live,
      select: {
        slug: true,
        title: true,
        synopsis: true,
        updatedAt: true,
        posterUrl: true,
        episodes: {
          where: videoWhere,
          orderBy: { number: "asc" },
          take: 1,
          select: {
            durationSec: true,
            thumbnailUrl: true,
            createdAt: true,
            sources: { where: { isActive: true }, orderBy: [{ priority: "asc" }, { id: "asc" }], take: 1, select: { type: true, url: true } },
          },
        },
      },
    }),
    prisma.genre.findMany({ select: { slug: true } }),
    prisma.country.findMany({ select: { slug: true } }),
    prisma.actor.findMany({ select: { slug: true } }),
    prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return { dramas, genres, countries, actors, posts };
}
