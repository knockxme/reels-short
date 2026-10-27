import { DramaForm } from "@/components/admin/DramaForm";
import { Card } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth";

export default async function NewDrama() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">New drama</h1>
      <Card>
        <DramaForm />
      </Card>
      <p className="text-sm text-muted">After creating, you can paste episode links on the next screen.</p>
    </div>
  );
}
