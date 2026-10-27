"use client";

import { startTransition, useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";

type Action = (state: ActionState, fd: FormData) => Promise<ActionState>;

export function ActionForm({
  action,
  children,
  className,
  submitLabel = "Save",
  pendingLabel = "Saving…",
  resetOnOk = false,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
  pendingLabel?: string;
  resetOnOk?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form
      // Submit manually: React's default form action resets every field, which would wipe the admin's input on a validation error.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className={className}
      key={resetOnOk ? state?.ok : undefined}
      aria-busy={pending}
    >
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary h-10 px-5 disabled:opacity-60">
          {pending ? pendingLabel : submitLabel}
        </button>
        {state?.error && <p role="alert" className="text-sm text-red-400">{state.error}</p>}
        {state?.ok && <p role="status" className="text-sm text-emerald-400">{state.ok}</p>}
      </div>
    </form>
  );
}

/** Small form button with a confirm step. Deletes in the admin move things to the trash. */
export function DeleteButton({ action, id, extra, label = "Move to trash", confirmText = "Move this to the trash? You can restore it for 30 days.", tone = "danger" }: {
  action: (fd: FormData) => Promise<void>;
  id: number | string;
  extra?: Record<string, string>;
  label?: string;
  confirmText?: string | null;
  tone?: "danger" | "neutral";
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirmText && !confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {Object.entries(extra ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        className={`btn h-9 px-3 text-sm ring-1 ${tone === "danger" ? "text-red-400 ring-red-400/40 hover:bg-red-400/10" : "ring-line hover:bg-surface-2"}`}
      >
        {label}
      </button>
    </form>
  );
}

export function Notice({ tone = "ok", children }: { tone?: "ok" | "warn"; children: React.ReactNode }) {
  return (
    <p role="status" className={`rounded-lg p-3 text-sm ${tone === "ok" ? "bg-emerald-500/10 text-emerald-300" : "bg-gold/10 text-gold"}`}>
      {children}
    </p>
  );
}
