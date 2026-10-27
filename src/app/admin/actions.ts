"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { login, logout, requireAdmin, revokeSessions } from "@/lib/auth";
import { TAGS } from "@/lib/data";
import { prisma } from "@/lib/db";
import { pingIndexNow } from "@/lib/indexnow";
import { dramaPath } from "@/lib/site";
import { slugify } from "@/lib/slug";
import { fetchDmVideo, parseDailymotion } from "@/lib/dailymotion";
import { parseSourceInput, type ParsedSource } from "@/lib/source";

export type ActionState = { error?: string; ok?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optStr = (fd: FormData, k: string) => str(fd, k) || null;
const optInt = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v && Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : null;
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on";
const list = (v: string) =>
  v
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

function invalidateDrama(slug: string) {
  updateTag(TAGS.dramas);
  updateTag(TAGS.drama(slug));
}

function friendly(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("Unique constraint")) return "That slug is already used (check the trash too). Choose another one.";
  if (msg.includes("Record to update not found") || msg.includes("No record was found")) return "This item is in the trash. Restore it first.";
  return msg.split("\n").at(-1)?.slice(0, 200) || "Something went wrong";
}

/* ---------- auth ---------- */

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const h = await headers();
  const ip = (h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local").slice(0, 64);
  const error = await login(str(fd, "username").slice(0, 100), String(fd.get("password") ?? "").slice(0, 200), ip, h.get("user-agent") ?? "");
  if (error) return { error };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

export async function revokeSessionAction(fd: FormData) {
  const me = await requireAdmin();
  const id = str(fd, "id");
  if (id === me.sid) {
    await logout();
    redirect("/admin/login");
  }
  await revokeSessions({ id });
  redirect("/admin/security");
}

export async function revokeOtherSessionsAction() {
  const me = await requireAdmin();
  await revokeSessions({ keep: me.sid });
  redirect("/admin/security?revoked=1");
}

/* ---------- dramas ---------- */

const urlField = z
  .string()
  .max(2000)
  .url("Must be a full https:// URL")
  .refine((u) => u.startsWith("https://"), "Must be a full https:// URL");

/** Optional image/link field: null when empty, error message when not an https URL. */
function optUrl(fd: FormData, k: string, label: string): { value: string | null } | { error: string } {
  const v = optStr(fd, k);
  if (!v) return { value: null };
  return urlField.safeParse(v).success ? { value: v } : { error: `${label} must be a full https:// URL` };
}

const dramaSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug may only contain a-z, 0-9 and -").max(100),
  synopsis: z.string().min(20, "Write a synopsis of at least 20 characters (aim for 150+ words for SEO)").max(20000),
  posterUrl: urlField,
  trailerUrl: urlField.nullable(),
  seoTitle: z.string().max(120).nullable(),
  seoDescription: z.string().max(320).nullable(),
});

export async function saveDrama(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = optInt(fd, "id");
  const title = str(fd, "title");
  const raw = {
    title,
    slug: slugify(str(fd, "slug") || title),
    synopsis: str(fd, "synopsis"),
    posterUrl: str(fd, "posterUrl"),
    trailerUrl: optStr(fd, "trailerUrl"),
    seoTitle: optStr(fd, "seoTitle"),
    seoDescription: optStr(fd, "seoDescription"),
  };
  if (!raw.slug) return { error: "Enter a URL slug in English letters (the title has none), e.g. crash-landing-on-you" };
  const parsed = dramaSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const rating = Number(str(fd, "rating"));
  const actorNames = list(str(fd, "actors"));
  const data = {
    ...parsed.data,
    altTitles: list(str(fd, "altTitles")),
    year: optInt(fd, "year"),
    // Every title is a single complete video.
    type: "MOVIE" as const,
    status: "COMPLETED" as const,
    network: optStr(fd, "network"),
    rating: str(fd, "rating") && rating >= 0 && rating <= 10 ? rating : null,
    featured: bool(fd, "featured"),
    featuredOrder: Math.max(0, Math.min(999, optInt(fd, "featuredOrder") ?? 0)),
    published: bool(fd, "published"),
    countryId: optInt(fd, "countryId"),
  };
  const genreIds = fd.getAll("genreIds").map(Number).filter(Number.isInteger);
  const actors = actorNames.map((name) => ({ where: { slug: slugify(name) }, create: { name, slug: slugify(name) } }));

  let saved: { id: number; slug: string };
  let oldSlug: string | null = null;
  try {
    if (id) {
      oldSlug = (await prisma.drama.findUnique({ where: { id }, select: { slug: true } }))?.slug ?? null;
      // A trashed drama must be restored first, or saving "published" would put it back on the site.
      saved = await prisma.drama.update({
        where: { id, deletedAt: null },
        data: {
          ...data,
          genres: { set: genreIds.map((g) => ({ id: g })) },
          actors: { set: [], connectOrCreate: actors },
        },
        select: { id: true, slug: true },
      });
    } else {
      saved = await prisma.drama.create({
        data: { ...data, genres: { connect: genreIds.map((g) => ({ id: g })) }, actors: { connectOrCreate: actors } },
        select: { id: true, slug: true },
      });
    }
  } catch (err) {
    return { error: friendly(err) };
  }

  invalidateDrama(saved.slug);
  if (oldSlug && oldSlug !== saved.slug) updateTag(TAGS.drama(oldSlug));
  updateTag(TAGS.taxonomy);
  if (data.published) await pingIndexNow([dramaPath(saved.slug)]);
  if (!id) redirect(`/admin/dramas/${saved.id}?created=1`);
  return { ok: "Saved" };
}

const ids = (fd: FormData) => fd.getAll("ids").map(Number).filter(Number.isInteger);

/* Deleting moves rows to the trash (see lib/trash). */
const trashData = () => ({ deletedAt: new Date(), published: false, featured: false });

async function trashDramaIds(dramaIds: number[]) {
  const where = { id: { in: dramaIds }, deletedAt: null };
  const dramas = await prisma.drama.findMany({ where, select: { slug: true } });
  await prisma.drama.updateMany({ where, data: trashData() });
  dramas.forEach((d) => invalidateDrama(d.slug));
  updateTag(TAGS.taxonomy);
}

export async function deleteDrama(fd: FormData) {
  await requireAdmin();
  await trashDramaIds([Number(fd.get("id"))]);
  redirect("/admin/dramas?trashed=1");
}

export async function deleteDramas(fd: FormData) {
  await requireAdmin();
  await trashDramaIds(ids(fd));
  redirect("/admin/dramas?trashed=1");
}

/* ---------- video ---------- */

/*
 * Every title is one full video. It is stored as the drama's episode number 1, whose sources are
 * the video's servers (Server 1, backups). Admins never see the word "episode".
 */

type CheckedSource = { source: ParsedSource; meta?: { durationSec: number | null; thumbnailUrl: string | null } };

/** A Dailymotion link must pass the embed checks; its length and thumbnail come back for free. */
async function checkSource(input: string): Promise<CheckedSource | { error: string }> {
  const parsed = parseSourceInput(input);
  if ("error" in parsed) return parsed;
  if (parsed.type !== "DAILYMOTION") return { source: parsed };
  const video = await fetchDmVideo(parseDailymotion(parsed.url)!.id);
  if ("error" in video) return video;
  return { source: parsed, meta: { durationSec: video.durationSec, thumbnailUrl: video.thumbnailUrl } };
}

/** The title's video row, created on first use and brought back if it was trashed. */
async function videoFor(dramaId: number) {
  const ep = await prisma.episode.upsert({
    where: { dramaId_number: { dramaId, number: 1 } },
    create: { dramaId, number: 1 },
    update: {},
    select: { id: true, durationSec: true, thumbnailUrl: true, deletedAt: true },
  });
  if (ep.deletedAt) await prisma.episode.update({ where: { id: ep.id }, data: { deletedAt: null, published: true } });
  return ep;
}

async function liveDrama(dramaId: number) {
  return prisma.drama.findUnique({ where: { id: dramaId, deletedAt: null }, select: { id: true, slug: true, published: true } });
}

export async function addVideoSource(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const drama = await liveDrama(Number(fd.get("dramaId")));
  if (!drama) return { error: "Drama not found (it may be in the trash)" };
  const checked = await checkSource(str(fd, "input"));
  if ("error" in checked) return { error: checked.error };

  const ep = await videoFor(drama.id);
  const count = await prisma.source.count({ where: { episodeId: ep.id } });
  await prisma.source.create({
    data: { episodeId: ep.id, label: str(fd, "label") || `Server ${count + 1}`, url: checked.source.url, type: checked.source.type, priority: count },
  });
  // Fill length and thumbnail from Dailymotion unless they were already set by hand.
  if (checked.meta) {
    await prisma.episode.update({
      where: { id: ep.id },
      data: { durationSec: ep.durationSec ?? checked.meta.durationSec, thumbnailUrl: ep.thumbnailUrl ?? checked.meta.thumbnailUrl },
    });
  }
  await prisma.drama.update({ where: { id: drama.id }, data: { updatedAt: new Date() } });
  invalidateDrama(drama.slug);
  if (drama.published && count === 0) await pingIndexNow([dramaPath(drama.slug)]);
  return { ok: count ? `Backup server added (${checked.source.type})` : `Video added (${checked.source.type})` };
}

export async function saveVideoDetails(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const drama = await liveDrama(Number(fd.get("dramaId")));
  if (!drama) return { error: "Drama not found (it may be in the trash)" };
  const thumb = optUrl(fd, "thumbnailUrl", "Thumbnail URL");
  if ("error" in thumb) return thumb;
  const minutes = optInt(fd, "durationMin");
  const ep = await videoFor(drama.id);
  // Keep exact seconds from Dailymotion unless the admin changed the minutes.
  const sameMinutes = minutes !== null && ep.durationSec !== null && Math.round(ep.durationSec / 60) === minutes;
  await prisma.episode.update({
    where: { id: ep.id },
    data: { durationSec: sameMinutes ? ep.durationSec : minutes && minutes > 0 ? minutes * 60 : null, thumbnailUrl: thumb.value },
  });
  invalidateDrama(drama.slug);
  return { ok: "Saved" };
}

export async function updateSource(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const checked = await checkSource(str(fd, "input"));
  if ("error" in checked) return { error: checked.error };
  const src = await prisma.source.update({
    where: { id },
    data: {
      label: str(fd, "label") || "Server",
      url: checked.source.url,
      type: checked.source.type,
      priority: optInt(fd, "priority") ?? 0,
      isActive: bool(fd, "isActive"),
    },
    select: { episode: { select: { drama: { select: { slug: true } } } } },
  });
  invalidateDrama(src.episode.drama.slug);
  return { ok: "Saved" };
}

export async function deleteSource(fd: FormData) {
  await requireAdmin();
  const src = await prisma.source.delete({
    where: { id: Number(fd.get("id")) },
    select: { episode: { select: { dramaId: true, drama: { select: { slug: true } } } } },
  });
  invalidateDrama(src.episode.drama.slug);
  redirect(`/admin/dramas/${src.episode.dramaId}#video`);
}

/* ---------- genres / countries ---------- */

export async function saveTaxonomy(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const kind = str(fd, "kind");
  const id = optInt(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required" };
  const data = { name, slug: slugify(str(fd, "slug") || name), description: optStr(fd, "description") };
  if (!data.slug) return { error: "Enter a slug in English letters" };
  try {
    if (kind === "genre") {
      if (id) await prisma.genre.update({ where: { id }, data });
      else await prisma.genre.create({ data });
    } else if (kind === "country") {
      if (id) await prisma.country.update({ where: { id }, data });
      else await prisma.country.create({ data });
    } else if (kind === "actor" && id) {
      const photo = optUrl(fd, "photoUrl", "Photo URL");
      if ("error" in photo) return photo;
      await prisma.actor.update({
        where: { id },
        data: { name, slug: data.slug, bio: data.description, photoUrl: photo.value },
      });
    } else return { error: "Unknown type" };
  } catch (err) {
    return { error: friendly(err) };
  }
  updateTag(TAGS.taxonomy);
  updateTag(TAGS.dramas);
  return { ok: id ? "Saved" : `Added ${name}` };
}

export async function deleteTaxonomy(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const kind = str(fd, "kind");
  if (kind === "genre") await prisma.genre.delete({ where: { id } });
  if (kind === "country") await prisma.country.delete({ where: { id } });
  if (kind === "actor") await prisma.actor.delete({ where: { id } });
  updateTag(TAGS.taxonomy);
  updateTag(TAGS.dramas);
  redirect(kind === "actor" ? "/admin/taxonomy?tab=actors" : "/admin/taxonomy");
}

/* ---------- posts ---------- */

export async function savePost(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = optInt(fd, "id");
  const title = str(fd, "title");
  const excerpt = str(fd, "excerpt");
  const content = str(fd, "content");
  if (!title || !excerpt || !content) return { error: "Title, excerpt and content are required" };
  if (!slugify(str(fd, "slug") || title)) return { error: "Enter a slug in English letters" };
  const cover = optUrl(fd, "coverUrl", "Cover URL");
  if ("error" in cover) return cover;
  const data = {
    title,
    slug: slugify(str(fd, "slug") || title),
    excerpt: excerpt.slice(0, 300),
    content,
    coverUrl: cover.value,
    published: bool(fd, "published"),
  };
  let saved: { id: number; slug: string };
  try {
    saved = id
      ? await prisma.post.update({ where: { id, deletedAt: null }, data, select: { id: true, slug: true } })
      : await prisma.post.create({ data, select: { id: true, slug: true } });
  } catch (err) {
    return { error: friendly(err) };
  }
  updateTag(TAGS.posts);
  if (data.published) await pingIndexNow([`/blog/${saved.slug}`]);
  if (!id) redirect(`/admin/posts/${saved.id}`);
  return { ok: "Saved" };
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  await prisma.post.update({ where: { id: Number(fd.get("id")) }, data: { deletedAt: new Date(), published: false } });
  updateTag(TAGS.posts);
  redirect("/admin/posts?trashed=1");
}

/* ---------- trash ---------- */

const trashKinds = ["drama", "episode", "post"] as const;
type TrashKind = (typeof trashKinds)[number];

function trashTarget(fd: FormData): { kind: TrashKind; id: number } | null {
  const kind = str(fd, "kind") as TrashKind;
  const id = Number(fd.get("id"));
  return trashKinds.includes(kind) && Number.isInteger(id) ? { kind, id } : null;
}

/** Restores as a draft, so nothing goes live again until it is checked and re-published. */
export async function restoreFromTrash(fd: FormData) {
  await requireAdmin();
  const t = trashTarget(fd);
  if (!t) redirect("/admin/trash");
  const data = { deletedAt: null };
  if (t.kind === "drama") {
    const d = await prisma.drama.update({ where: { id: t.id }, data, select: { slug: true } });
    invalidateDrama(d.slug);
    updateTag(TAGS.taxonomy);
    redirect(`/admin/dramas/${t.id}?restored=1`);
  }
  if (t.kind === "episode") {
    // A title's video: its drama's own "Published" setting decides visibility, so the video goes straight back.
    const ep = await prisma.episode.update({
      where: { id: t.id },
      data: { deletedAt: null, published: true },
      select: { dramaId: true, drama: { select: { slug: true } } },
    });
    invalidateDrama(ep.drama.slug);
    redirect(`/admin/dramas/${ep.dramaId}#video`);
  }
  await prisma.post.update({ where: { id: t.id }, data });
  updateTag(TAGS.posts);
  redirect(`/admin/posts/${t.id}?restored=1`);
}

/** Permanent delete, only for rows already in the trash. */
export async function deleteForever(fd: FormData) {
  await requireAdmin();
  const t = trashTarget(fd);
  if (t) {
    const where = { id: t.id, deletedAt: { not: null } };
    if (t.kind === "drama") await prisma.drama.deleteMany({ where });
    if (t.kind === "episode") await prisma.episode.deleteMany({ where });
    if (t.kind === "post") await prisma.post.deleteMany({ where });
  }
  redirect("/admin/trash");
}

export async function emptyTrash() {
  await requireAdmin();
  const where = { deletedAt: { not: null } };
  await prisma.episode.deleteMany({ where });
  await prisma.drama.deleteMany({ where });
  await prisma.post.deleteMany({ where });
  redirect("/admin/trash?emptied=1");
}

/* ---------- homepage slider ---------- */

/** Swaps a featured drama with its neighbour in the slider order. */
export async function moveFeatured(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const dir = str(fd, "dir") === "up" ? -1 : 1;
  const list = await prisma.drama.findMany({
    where: { featured: true, deletedAt: null },
    orderBy: [{ featuredOrder: "asc" }, { updatedAt: "desc" }],
    select: { id: true },
  });
  const i = list.findIndex((d) => d.id === id);
  const j = i + dir;
  if (i >= 0 && j >= 0 && j < list.length) {
    [list[i], list[j]] = [list[j], list[i]];
    // Rewrite every position so ties left by older data become a clean 1..n sequence.
    await prisma.$transaction(list.map((d, n) => prisma.drama.update({ where: { id: d.id }, data: { featuredOrder: n + 1 } })));
    updateTag(TAGS.dramas);
  }
  redirect("/admin#slider");
}
