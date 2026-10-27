import { Breadcrumbs } from "./Breadcrumbs";
import { Markdown } from "./Markdown";

export function StaticPage({ title, path, body }: { title: string; path: string; body: string }) {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-4">
      <Breadcrumbs items={[{ name: title, path }]} />
      <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">{title}</h1>
      <Markdown source={body} />
    </article>
  );
}
