"use client";

import { useEffect, useState } from "react";

const selector = (formId: string) => `input[name="ids"][form="${formId}"]`;

/**
 * Select-all toggle, selected count and a delete button for a list of <BulkCheck> boxes.
 * The boxes join this form through the `form` attribute, so they can sit anywhere in the list.
 */
export function BulkBar({ formId, action, noun, extra }: {
  formId: string;
  action: (fd: FormData) => Promise<void>;
  noun: string;
  extra?: Record<string, string>;
}) {
  const [selected, setSelected] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const count = () => {
      const boxes = document.querySelectorAll<HTMLInputElement>(selector(formId));
      setTotal(boxes.length);
      setSelected([...boxes].filter((b) => b.checked).length);
    };
    count();
    document.addEventListener("change", count);
    return () => document.removeEventListener("change", count);
  }, [formId]);

  function toggleAll(checked: boolean) {
    document.querySelectorAll<HTMLInputElement>(selector(formId)).forEach((b) => (b.checked = checked));
    setSelected(checked ? total : 0);
  }

  if (!total) return null;
  return (
    <form
      id={formId}
      action={action}
      onSubmit={(e) => {
        if (!selected || !confirm(`Move ${selected} ${noun}${selected === 1 ? "" : "s"} to the trash? You can restore them for 30 days.`)) e.preventDefault();
      }}
      className="mb-3 flex flex-wrap items-center gap-3 text-sm"
    >
      {Object.entries(extra ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label className="flex items-center gap-2">
        <input type="checkbox" className="size-4 accent-current" checked={selected === total} onChange={(e) => toggleAll(e.target.checked)} />
        Select all
      </label>
      <span className="text-muted">{selected} selected</span>
      <button
        type="submit"
        disabled={!selected}
        className="btn ml-auto h-9 px-3 text-red-400 ring-1 ring-red-400/40 hover:bg-red-400/10 disabled:opacity-40"
      >
        Move to trash
      </button>
    </form>
  );
}

export function BulkCheck({ formId, id, label, className }: { formId: string; id: number; label: string; className?: string }) {
  return <input type="checkbox" name="ids" value={id} form={formId} aria-label={`Select ${label}`} className={`size-4 shrink-0 ${className ?? ""}`} />;
}
