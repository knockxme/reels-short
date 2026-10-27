import "server-only";
import { prisma } from "./db";

/*
 * Deleting in the admin moves rows to the trash: they are unpublished (so every public query
 * already hides them) and stamped with deletedAt. Restoring brings them back as drafts.
 * Anything left in the trash longer than TRASH_DAYS is deleted for good.
 */
export const TRASH_DAYS = 30;

export async function purgeOldTrash() {
  const before = new Date(Date.now() - TRASH_DAYS * 24 * 3600 * 1000);
  const where = { deletedAt: { lt: before } };
  const [dramas, episodes, posts] = await Promise.all([
    prisma.drama.deleteMany({ where }),
    prisma.episode.deleteMany({ where }),
    prisma.post.deleteMany({ where }),
  ]);
  return dramas.count + episodes.count + posts.count;
}

export function trashContents() {
  const where = { deletedAt: { not: null } };
  const orderBy = { deletedAt: "desc" } as const;
  return Promise.all([
    prisma.drama.findMany({ where, orderBy, select: { id: true, title: true, posterUrl: true, deletedAt: true, _count: { select: { episodes: true } } } }),
    // Episodes of a trashed drama are restored with it, so only list ones trashed on their own.
    prisma.episode.findMany({
      where: { ...where, drama: { deletedAt: null } },
      orderBy,
      select: { id: true, number: true, deletedAt: true, drama: { select: { id: true, title: true } } },
    }),
    prisma.post.findMany({ where, orderBy, select: { id: true, title: true, deletedAt: true } }),
  ]);
}
