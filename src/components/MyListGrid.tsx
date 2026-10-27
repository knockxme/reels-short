"use client";

import Image from "next/image";
import Link from "next/link";
import { toggleList, useMyList } from "@/lib/library";
import { dramaPath } from "@/lib/site";
import { CloseIcon } from "./icons";

export function MyListGrid() {
  const list = useMyList();
  if (!list.length) {
    return (
      <p className="py-12 text-center text-sm text-muted">
        Nothing saved yet. Tap <strong>My List</strong> on any drama to save it here.
        <br />
        <Link href="/browse" className="mt-4 inline-block text-accent-soft underline">
          Browse dramas
        </Link>
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {list.map((d) => (
        <li key={d.slug} className="relative">
          <Link href={dramaPath(d.slug)} className="block">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/5">
              <Image src={d.poster} alt={d.title} fill sizes="(max-width: 640px) 33vw, 160px" className="object-cover" />
            </div>
            <p className="mt-2 line-clamp-2 text-[13px] font-semibold">{d.title}</p>
          </Link>
          <button
            type="button"
            onClick={() => toggleList(d)}
            className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-black/60"
            aria-label={`Remove ${d.title}`}
          >
            <CloseIcon className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
