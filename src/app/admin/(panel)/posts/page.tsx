import Link from "next/link";
import { Notice } from "@/components/admin/ActionForm";
import { LocalTime } from "@/components/admin/LocalTime";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminPosts({ searchParams }: PageProps<"/admin/posts">) {
  await requireAdmin();
  const { trashed } = await searchParams;
  const posts = await prisma.post.findMany({
    where: { deletedAt: null },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, published: true, publishedAt: true },
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Blog posts</h1>
        <Link href="/admin/posts/new" className="btn btn-primary ml-auto h-10">+ New post</Link>
      </div>
      {trashed && (
        <Notice>
          Post moved to the trash. <Link href="/admin/trash" className="underline">Restore it from the trash</Link>.
        </Notice>
      )}
      <ul className="divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-line">
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/posts/${p.id}`} className="flex justify-between gap-3 p-3 text-sm transition-colors hover:bg-surface-2">
              <span className="min-w-0 truncate font-semibold">{p.title}</span>
              <span className="shrink-0 text-xs text-muted">{p.published ? <LocalTime date={p.publishedAt} dateOnly /> : <span className="font-semibold text-gold">DRAFT</span>}</span>
            </Link>
          </li>
        ))}
        {!posts.length && <li className="p-6 text-center text-sm text-muted">No posts yet.</li>}
      </ul>
    </div>
  );
}
