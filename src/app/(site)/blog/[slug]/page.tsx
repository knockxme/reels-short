import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { getPost, getPosts } from "@/lib/data";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const { items } = await getPosts(1);
  return items.length ? items.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 pt-4">
      <Breadcrumbs items={[{ name: "News", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]} />
      <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
      <time className="mt-2 block text-xs text-muted" dateTime={post.publishedAt.toISOString()}>
        {post.publishedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </time>
      {post.coverUrl && (
        <div className="relative my-6 aspect-video overflow-hidden rounded-xl">
          <Image src={post.coverUrl} alt={post.title} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      )}
      <Markdown source={post.content} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: post.coverUrl ? [post.coverUrl] : undefined,
          datePublished: post.publishedAt.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
          author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          publisher: { "@id": `${SITE_URL}/#organization` },
        }}
      />
    </article>
  );
}
