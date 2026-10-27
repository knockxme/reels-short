"use client";

import { useState } from "react";
import { Field, inputCls } from "./fields";

/** URL input with a live preview, so a broken or wrong image is caught before saving. */
export function ImageUrlField({
  label,
  name,
  defaultValue,
  hint,
  required,
  aspect = "2/3",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  hint?: string;
  required?: boolean;
  aspect?: "2/3" | "3/4" | "16/9" | "1/1";
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const valid = /^https:\/\/\S+$/.test(url.trim());
  const width = aspect === "16/9" ? "w-32" : aspect === "3/4" ? "w-24" : "w-16";

  return (
    <div className="flex items-start gap-3">
      <div
        className={`${width} mt-5 shrink-0 overflow-hidden rounded-lg bg-bg ring-1 ${status === "error" ? "ring-red-400/70" : "ring-line"}`}
        style={{ aspectRatio: aspect }}
      >
        {valid ? (
          // Plain <img>: the preview must show the exact URL, not an optimizer copy.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url.trim()}
            alt=""
            className="size-full object-cover"
            onLoad={() => setStatus("ok")}
            onError={() => setStatus("error")}
          />
        ) : (
          <span className="grid size-full place-items-center text-[10px] text-muted">No image</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Field label={label} hint={hint}>
          <input
            className={inputCls}
            name={name}
            type="url"
            inputMode="url"
            required={required}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setStatus("idle");
            }}
            aria-invalid={status === "error" || undefined}
          />
        </Field>
        {url && !valid && <p className="mt-1 text-xs text-red-400">Must start with https://</p>}
        {valid && status === "error" && <p className="mt-1 text-xs text-red-400">This image could not be loaded. Check the link.</p>}
      </div>
    </div>
  );
}
