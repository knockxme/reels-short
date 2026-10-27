"use client";

import { useState } from "react";
import { ShareIcon } from "./icons";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
      return;
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button type="button" onClick={share} className="btn btn-secondary" aria-live="polite">
      <ShareIcon className="size-4" />
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
