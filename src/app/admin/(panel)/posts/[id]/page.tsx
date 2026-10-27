import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePost, restoreFromTrash } from "../../../actions";
import { DeleteButton, Notice } from "@/components/admin/ActionForm";
import { Card } from "@/components/admin/fields";
import { LocalTime } from "@/components/admin/LocalTime";
import { PostForm } from "@/components/admin/PostForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function EditPost({ params, searchParams }: PageProps<"/admin/posts/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  const { restored } = await searchParams;
  const post = Number.isInteger(id) ? await prisma.post.findUnique({ where: { id } }) : null;
  if (!post) notFound();
  if (post.deletedAt) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold">{post.title}</h1>
        <Notice tone="warn">
          This post is in the trash (moved <LocalTime date={post.deletedAt} />). Restore it to edit it. It comes back as a draft.
        </Notice>
        <DeleteButton action={restoreFromTrash} id={post.id} extra={{ kind: "post" }} label="Restore as draft" confirmText={null} tone="neutral" />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Edit post</h1>
        {!post.published && <span className="rounded-md bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">DRAFT</span>}
        <Link href={`/blog/${post.slug}`} target="_blank" className="text-sm text-accent-soft">View ↗</Link>
        <div className="ml-auto">
          <DeleteButton action={deletePost} id={post.id} />
        </div>
      </div>
      {restored && <Notice>Restored from the trash as a draft. Tick “Published” and save when it is ready.</Notice>}
      <Card>
        <PostForm post={post} />
      </Card>
    </div>
  );
}
