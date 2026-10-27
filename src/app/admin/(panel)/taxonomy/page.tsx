import Link from "next/link";
import { deleteTaxonomy, saveTaxonomy } from "../../actions";
import { ActionForm, DeleteButton } from "@/components/admin/ActionForm";
import { Card, Text } from "@/components/admin/fields";
import { ImageUrlField } from "@/components/admin/ImageUrlField";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Row = { id: number; name: string; slug: string; description?: string | null; bio?: string | null; photoUrl?: string | null; _count: { dramas: number } };

function Section({ kind, title, rows }: { kind: "genre" | "country" | "actor"; title: string; rows: Row[] }) {
  return (
    <Card title={`${title} (${rows.length})`}>
      {kind !== "actor" && (
        <ActionForm action={saveTaxonomy} submitLabel={`Add ${kind}`} resetOnOk className="mb-6 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="kind" value={kind} />
          <Text label="Name" name="name" required />
          <Text label="Slug (optional)" name="slug" />
          <Text label="SEO intro (optional)" name="description" />
        </ActionForm>
      )}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id}>
            <details className="rounded-lg bg-bg ring-1 ring-line">
              <summary className="flex cursor-pointer items-center justify-between p-3 text-sm">
                <span className="font-semibold">{r.name}</span>
                <span className="text-xs text-muted">/{r.slug} · {r._count.dramas} dramas</span>
              </summary>
              <div className="border-t border-line p-3">
                <ActionForm action={saveTaxonomy} className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="id" value={r.id} />
                  <Text label="Name" name="name" defaultValue={r.name} required />
                  <Text label="Slug" name="slug" defaultValue={r.slug} />
                  {kind === "actor" && (
                    <div className="sm:col-span-2">
                      <ImageUrlField label="Photo URL" name="photoUrl" defaultValue={r.photoUrl} aspect="1/1" />
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <Text label={kind === "actor" ? "Bio" : "SEO intro text"} name="description" defaultValue={(kind === "actor" ? r.bio : r.description) ?? ""} hint="100+ unique words helps this page rank" />
                  </div>
                </ActionForm>
                <div className="mt-3">
                  <DeleteButton
                    action={deleteTaxonomy}
                    id={r.id}
                    extra={{ kind }}
                    label={`Delete ${kind}`}
                    confirmText={`Delete “${r.name}” permanently? Dramas keep existing; they just lose this ${kind}.`}
                  />
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default async function TaxonomyPage({ searchParams }: PageProps<"/admin/taxonomy">) {
  await requireAdmin();
  const tab = (await searchParams).tab === "actors" ? "actors" : "main";
  const count = { _count: { select: { dramas: true } } } as const;
  if (tab === "actors") {
    const actors = await prisma.actor.findMany({ orderBy: { name: "asc" }, include: count, take: 500 });
    return (
      <div className="space-y-4">
        <Tabs tab={tab} />
        <Section kind="actor" title="Actors" rows={actors} />
      </div>
    );
  }
  const [genres, countries] = await Promise.all([
    prisma.genre.findMany({ orderBy: { name: "asc" }, include: count }),
    prisma.country.findMany({ orderBy: { name: "asc" }, include: count }),
  ]);
  return (
    <div className="space-y-6">
      <Tabs tab={tab} />
      <Section kind="genre" title="Genres" rows={genres} />
      <Section kind="country" title="Countries" rows={countries} />
    </div>
  );
}

function Tabs({ tab }: { tab: string }) {
  const cls = (on: boolean) => `rounded-lg px-4 py-2 text-sm ${on ? "bg-accent font-bold text-accent-ink" : "bg-surface"}`;
  return (
    <div className="flex gap-2">
      <Link href="/admin/taxonomy" className={cls(tab === "main")}>Genres & Countries</Link>
      <Link href="/admin/taxonomy?tab=actors" className={cls(tab === "actors")}>Actors</Link>
    </div>
  );
}
