export const inputCls =
  // 16px on phones so iOS Safari doesn't zoom in when a field is focused.
  "mt-1 w-full rounded-lg bg-bg px-3 py-2.5 text-base ring-1 ring-line outline-none focus:ring-2 focus:ring-accent placeholder:text-muted/60 sm:text-sm";

// The hint sits outside <label> so it does not become part of the field's accessible name.
export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
        {children}
      </label>
      {hint && <p className="mt-1 text-xs text-muted/80">{hint}</p>}
    </div>
  );
}

export function Text({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint}>
      <input className={inputCls} {...props} />
    </Field>
  );
}

export function Area({ label, hint, ...props }: { label: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint}>
      <textarea className={`${inputCls} min-h-28 font-[inherit]`} {...props} />
    </Field>
  );
}

export function Check({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="size-4 accent-[var(--accent)]" {...props} />
      {label}
    </label>
  );
}

export function Card({ title, children, id }: { title?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="rounded-xl bg-surface p-4 ring-1 ring-line sm:p-6">
      {title && <h2 className="mb-4 text-base font-bold">{title}</h2>}
      {children}
    </section>
  );
}
