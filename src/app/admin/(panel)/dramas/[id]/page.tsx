import Link from "next/link";
import { notFound } from "next/navigation";
import { addVideoSource, deleteDrama, deleteSource, restoreFromTrash, saveVideoDetails, updateSource } from "../../../actions";
import { ActionForm, DeleteButton, Notice } from "@/components/admin/ActionForm";
import { DramaForm, loadDrama } from "@/components/admin/DramaForm";
import { Card, Check, Text } from "@/components/admin/fields";
import { ImageUrlField } from "@/components/admin/ImageUrlField";
import { LocalTime } from "@/components/admin/LocalTime";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dramaPath, formatDuration } from "@/lib/site";

export default async function EditDrama({ params, searchParams }: PageProps<"/admin/dramas/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  const { created, restored } = await searchParams;
  const drama = Number.isInteger(id) ? await loadDrama(id) : null;
  if (!drama) notFound();
  if (drama.deletedAt) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold">{drama.title}</h1>
        <Notice tone="warn">
          This drama is in the trash (moved <LocalTime date={drama.deletedAt} />). Restore it to edit it. It comes back as a draft.
        </Notice>
        <DeleteButton action={restoreFromTrash} id={drama.id} extra={{ kind: "drama" }} label="Restore as draft" confirmText={null} tone="neutral" />
      </div>
    );
  }

  // The title's single full video (stored as its first episode row).
  const video = await prisma.episode.findFirst({
    where: { dramaId: id, deletedAt: null },
    orderBy: { number: "asc" },
    include: { sources: { orderBy: [{ priority: "asc" }, { id: "asc" }] } },
  });
  const sources = video?.sources ?? [];
  const working = sources.filter((s) => s.isActive && !(s.lastStatus === 0 || (s.lastStatus ?? 0) >= 400)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">{drama.title}</h1>
        {!drama.published && <span className="rounded-md bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">DRAFT</span>}
        <span className="text-sm text-muted tabular-nums">{drama.views.toLocaleString("en-US")} views</span>
        <Link href={dramaPath(drama.slug)} target="_blank" className="text-sm text-accent-soft">View ↗</Link>
        <div className="ml-auto">
          <DeleteButton action={deleteDrama} id={drama.id} confirmText="Move this drama and its video to the trash? It disappears from the site, and you can restore it for 30 days." />
        </div>
      </div>
      {created && <Notice>Drama created. Now add its video below.</Notice>}
      {restored && <Notice>Restored from the trash as a draft. Tick “Published” and save when it is ready to go live.</Notice>}

      <Card title="Video" id="video">
        {sources.length === 0 ? (
          <Notice tone="warn">No video yet. Visitors see “not available yet” until you add one.</Notice>
        ) : (
          <p className="mb-4 text-sm text-muted">
            {working} of {sources.length} server{sources.length === 1 ? "" : "s"} working
            {video?.durationSec ? ` · ${formatDuration(video.durationSec)}` : ""}. Viewers start on the first server and switch automatically if it fails.
          </p>
        )}

        <div className="space-y-4">
          {sources.map((s) => (
            <div key={s.id} className="rounded-lg bg-bg p-3 ring-1 ring-line">
              <ActionForm action={updateSource} className="space-y-3">
                <input type="hidden" name="id" value={s.id} />
                <div className="grid grid-cols-[1fr_5rem] gap-3 sm:grid-cols-[10rem_1fr_5rem]">
                  <Text label="Server name" name="label" defaultValue={s.label} />
                  <Text label="Order" name="priority" type="number" defaultValue={s.priority} />
                  <div className="col-span-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                    <Text label={`Link (${s.type})`} name="input" defaultValue={s.url} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                  <Check label="Active" name="isActive" defaultChecked={s.isActive} />
                  {s.lastCheckedAt && (
                    <span className={s.lastStatus === 0 || (s.lastStatus ?? 0) >= 400 ? "text-red-400" : "text-emerald-400"}>
                      Last check: {s.lastStatus || "timeout"} on <LocalTime date={s.lastCheckedAt} dateOnly />
                    </span>
                  )}
                </div>
              </ActionForm>
              <div className="mt-2">
                <DeleteButton action={deleteSource} id={s.id} label="Remove server" confirmText={`Remove “${s.label}”? This can't be undone.`} />
              </div>
            </div>
          ))}
        </div>

        <div className={sources.length ? "mt-6 border-t border-line pt-4" : ""}>
          <h3 className="mb-2 text-sm font-bold">{sources.length ? "Add a backup server" : "Add the video"}</h3>
          <ActionForm action={addVideoSource} submitLabel={sources.length ? "Add server" : "Add video"} resetOnOk className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <input type="hidden" name="dramaId" value={drama.id} />
            <Text label="Server name" name="label" placeholder={`Server ${sources.length + 1}`} />
            <Text
              label="Video link *"
              name="input"
              required
              placeholder="https://www.dailymotion.com/video/x8abc12"
              hint="Dailymotion link (checked automatically; length and thumbnail are filled in), iframe embed code, embed page URL, .m3u8 or .mp4."
            />
          </ActionForm>
        </div>

        {video && (
          <div className="mt-6 border-t border-line pt-4">
            <h3 className="mb-2 text-sm font-bold">Video details</h3>
            <ActionForm action={saveVideoDetails} className="space-y-4">
              <input type="hidden" name="dramaId" value={drama.id} />
              <div className="w-40">
                <Text
                  label="Length (minutes)"
                  name="durationMin"
                  type="number"
                  min={1}
                  defaultValue={video.durationSec ? Math.round(video.durationSec / 60) : ""}
                  hint="Shown on cards; helps video search."
                />
              </div>
              <ImageUrlField
                label="Video thumbnail (optional)"
                name="thumbnailUrl"
                defaultValue={video.thumbnailUrl}
                aspect="3/4"
                hint="Used by search engines for the video. Leave empty to use the cover image."
              />
            </ActionForm>
          </div>
        )}
      </Card>

      <Card title="Drama details">
        <DramaForm drama={drama} />
      </Card>
    </div>
  );
}
