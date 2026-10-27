import { Card } from "@/components/admin/fields";
import { PostForm } from "@/components/admin/PostForm";
import { requireAdmin } from "@/lib/auth";

export default async function NewPost() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">New post</h1>
      <Card>
        <PostForm />
      </Card>
    </div>
  );
}
