import Image from "next/image";
import Link from "next/link";
import { deleteForever, emptyTrash, restoreFromTrash } from "../../actions";
import { DeleteButton, Notice } from "@/components/admin/ActionForm";
import { Card } from "@/components/admin/fields";
import { LocalTime } from "@/components/admin/LocalTime";
import { requireAdmin } from "@/lib/auth";
import { purgeOldTrash, TRASH_DAYS, trashContents } from "@/lib/trash";

function daysLeft(deletedAt: Date) {
  return Math.max(0, TRASH_DAYS - Math.floor((Date.now() - deletedAt.getTime()) / 86_400_000));
}

function Row({ kind, id, title, sub, deletedAt, image }: { kind: string; id: number; title: string; sub?: string; deletedAt: Date; image?: string }) {
  const left = daysLeft(deletedAt);
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      {image && (
        <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-bg">
          <Image src={image} alt="" fill sizes="40px" className="object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{title}</p>
        <p className="text-xs text-muted">
          {sub && `${sub} · `}Trashed <LocalTime date={deletedAt} /> ·{" "}
          <span className={left <= 3 ? "text-red-400" : ""}>
            deleted for good in {left} day{left === 1 ? "" : "s"}
          </span>
        </p>
      </div>
      <div className="flex gap-2">
        <DeleteButton action={restoreFromTrash} id={id} extra={{ kind }} label="Restore" confirmText={null} tone="neutral" />
        <DeleteButton action={deleteForever} id={id} extra={{ kind }} label="Delete forever" confirmText={`Permanently delete “${title}”? This can't be undone.`} />
      </div>
    </li>
  );
}

export default async function TrashPage({ searchParams }: PageProps<"/admin/trash">) {
  await requireAdmin();
  const { emptied } = await searchParams;
  await purgeOldTrash();
  const [dramas, episodes, posts] = await trashContents();
  const total = dramas.length + episodes.length + posts.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Trash</h1>
        {total > 0 && (
          <div className="ml-auto">
            <DeleteButton
              action={emptyTrash}
              id=""
              label="Empty trash"
              confirmText={`Permanently delete all ${total} item(s) in the trash? This can't be undone.`}
            />
          </div>
        )}
      </div>
      <p className="text-sm text-muted">
        Deleted dramas, videos and posts stay here for {TRASH_DAYS} days and are hidden from the site. Restoring brings an item back as a draft.
      </p>
      {emptied && <Notice>The trash was emptied.</Notice>}

      {total === 0 && !emptied && <p className="rounded-xl bg-surface p-6 text-center text-sm text-muted ring-1 ring-line">The trash is empty.</p>}

      {dramas.length > 0 && (
        <Card title={`Dramas (${dramas.length})`}>
          <ul className="divide-y divide-line text-sm">
            {dramas.map((d) => (
              <Row key={d.id} kind="drama" id={d.id} title={d.title} image={d.posterUrl} sub={d._count.episodes ? "with video" : "no video"} deletedAt={d.deletedAt!} />
            ))}
          </ul>
        </Card>
      )}
      {episodes.length > 0 && (
        <Card title={`Videos (${episodes.length})`}>
          <ul className="divide-y divide-line text-sm">
            {episodes.map((e) => (
              <Row key={e.id} kind="episode" id={e.id} title={`${e.drama.title} · video`} deletedAt={e.deletedAt!} />
            ))}
          </ul>
        </Card>
      )}
      {posts.length > 0 && (
        <Card title={`Blog posts (${posts.length})`}>
          <ul className="divide-y divide-line text-sm">
            {posts.map((p) => (
              <Row key={p.id} kind="post" id={p.id} title={p.title} deletedAt={p.deletedAt!} />
            ))}
          </ul>
        </Card>
      )}
      <p className="text-xs text-muted">
        Looking for something else? <Link href="/admin/dramas" className="underline">Back to dramas</Link>.
      </p>
    </div>
  );
}
