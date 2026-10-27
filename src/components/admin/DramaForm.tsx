import { saveDrama } from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { ActionForm } from "./ActionForm";
import { Area, Check, Field, inputCls, Text } from "./fields";
import { ImageUrlField } from "./ImageUrlField";

type Drama = Awaited<ReturnType<typeof loadDrama>>;

export function loadDrama(id: number) {
  return prisma.drama.findUnique({
    where: { id },
    include: { genres: { select: { id: true } }, actors: { select: { name: true } } },
  });
}

export async function DramaForm({ drama }: { drama?: NonNullable<Drama> }) {
  const [genres, countries] = await Promise.all([
    prisma.genre.findMany({ orderBy: { name: "asc" } }),
    prisma.country.findMany({ orderBy: { name: "asc" } }),
  ]);
  const genreSet = new Set(drama?.genres.map((g) => g.id));

  return (
    <ActionForm action={saveDrama} submitLabel={drama ? "Save changes" : "Create drama"} className="space-y-4">
      {drama && <input type="hidden" name="id" value={drama.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Title *" name="title" defaultValue={drama?.title} required />
        <Text label="URL slug" name="slug" defaultValue={drama?.slug} hint="Leave empty to generate from title. Don't change after publishing." />
      </div>
      <Text label="Alternative titles" name="altTitles" defaultValue={drama?.altTitles.join(", ")} hint="Comma separated: native title, other English titles. Helps ranking for different searches." />
      <Area
        label="Synopsis *"
        name="synopsis"
        defaultValue={drama?.synopsis}
        rows={8}
        required
        hint="Write it yourself (150–300 words). Copied text from other sites will not rank. Blank line = new paragraph."
      />
      <ImageUrlField
        label="Cover image URL * (vertical)"
        name="posterUrl"
        defaultValue={drama?.posterUrl}
        required
        aspect="3/4"
        hint="Portrait cover, e.g. 720×960 or 1080×1920. Used on cards, the homepage slider, the player and social shares."
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Text label="Year" name="year" type="number" min={1950} max={2100} defaultValue={drama?.year ?? ""} />
        <Field label="Country">
          <select name="countryId" defaultValue={drama?.countryId ?? ""} className={inputCls}>
            <option value="">-</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Text label="Network" name="network" defaultValue={drama?.network ?? ""} placeholder="tvN, Netflix…" />
        <Text label="Rating (0-10)" name="rating" type="number" step="0.1" min={0} max={10} defaultValue={drama?.rating ?? ""} />
        <Text label="Trailer URL" name="trailerUrl" type="url" defaultValue={drama?.trailerUrl ?? ""} />
      </div>
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-muted">Genres</legend>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {genres.map((g) => (
            <Check key={g.id} label={g.name} name="genreIds" value={g.id} defaultChecked={genreSet.has(g.id)} />
          ))}
          {!genres.length && <span className="text-sm text-muted">Add genres in Genres & Countries first.</span>}
        </div>
      </fieldset>
      <Area label="Cast" name="actors" rows={2} defaultValue={drama?.actors.map((a) => a.name).join(", ")} hint="Comma separated names. New actors are created automatically (with their own SEO page)." />
      <details className="rounded-lg bg-bg p-3 ring-1 ring-line">
        <summary className="cursor-pointer text-sm font-semibold">SEO overrides (optional)</summary>
        <div className="mt-3 space-y-4">
          <Text label="SEO title" name="seoTitle" defaultValue={drama?.seoTitle ?? ""} maxLength={70} hint="Default: “{Title} ({Year}) Full Movie Eng Sub”" />
          <Area label="Meta description" name="seoDescription" defaultValue={drama?.seoDescription ?? ""} maxLength={160} rows={2} hint="Max 160 characters. Default: built from the synopsis." />
        </div>
      </details>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <Check label="Published" name="published" defaultChecked={drama?.published ?? true} />
        <Check label="Featured on home slider" name="featured" defaultChecked={drama?.featured ?? false} />
        <div className="w-36">
          <Text label="Slider position" name="featuredOrder" type="number" min={0} max={999} defaultValue={drama?.featuredOrder ?? 0} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted/80">Lower numbers show first. You can also reorder the slider from the dashboard.</p>
    </ActionForm>
  );
}
