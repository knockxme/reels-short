"use client";

import { toggleList, useMyList } from "@/lib/library";
import { BookmarkIcon } from "./icons";

export function MyListButton({ slug, title, poster }: { slug: string; title: string; poster: string }) {
  const list = useMyList();
  const saved = list.some((l) => l.slug === slug);
  return (
    <button
      type="button"
      onClick={() => toggleList({ slug, title, poster })}
      aria-pressed={saved}
      className={`btn ${saved ? "bg-accent/15 text-accent-soft ring-1 ring-accent/50 hover:bg-accent/25" : "btn-secondary"}`}
    >
      <BookmarkIcon className="size-4" fill={saved ? "currentColor" : "none"} />
      {saved ? "In My List" : "My List"}
    </button>
  );
}
