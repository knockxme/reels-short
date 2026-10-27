import { savePost } from "@/app/admin/actions";
import { ActionForm } from "./ActionForm";
import { Area, Check, Text } from "./fields";
import { ImageUrlField } from "./ImageUrlField";

type Post = { id: number; title: string; slug: string; excerpt: string; content: string; coverUrl: string | null; published: boolean };

export function PostForm({ post }: { post?: Post }) {
  return (
    <ActionForm action={savePost} submitLabel={post ? "Save post" : "Create post"} className="space-y-4">
      {post && <input type="hidden" name="id" value={post.id} />}
      <Text label="Title *" name="title" defaultValue={post?.title} required hint="Target a search phrase, e.g. “15 Best Revenge K-Dramas to Watch in 2026”" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Slug" name="slug" defaultValue={post?.slug} />
        <ImageUrlField label="Cover image URL (16:9)" name="coverUrl" defaultValue={post?.coverUrl} aspect="16/9" />
      </div>
      <Area label="Excerpt / meta description *" name="excerpt" rows={2} maxLength={300} defaultValue={post?.excerpt} required />
      <Area
        label="Content *"
        name="content"
        rows={18}
        defaultValue={post?.content}
        required
        hint="Formatting: “## Heading”, “### Subheading”, “- list item”, **bold**, [link text](/drama/some-slug). Blank line = new paragraph. Link to your drama pages!"
      />
      <Check label="Published" name="published" defaultChecked={post?.published ?? true} />
    </ActionForm>
  );
}
