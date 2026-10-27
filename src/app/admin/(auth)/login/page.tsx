import { loginAction } from "../../actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { Text } from "@/components/admin/fields";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-surface p-6 ring-1 ring-line">
      <h1 className="mb-5 text-xl font-extrabold">Admin login</h1>
      <ActionForm action={loginAction} submitLabel="Log in" pendingLabel="Signing in…" className="space-y-4">
        <Text label="Username" name="username" autoComplete="username" required />
        <Text label="Password" name="password" type="password" autoComplete="current-password" required />
      </ActionForm>
    </div>
  );
}
