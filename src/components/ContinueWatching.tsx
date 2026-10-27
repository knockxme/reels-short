"use client";

import Image from "next/image";
import Link from "next/link";
import { removeHistory, useHistory } from "@/lib/library";
import { dramaPath } from "@/lib/site";
import { Rail } from "./Rail";
import { CloseIcon, PlayIcon } from "./icons";

export function ContinueWatching() {
  const history = useHistory();
  if (!history.length) return null;
  return (
    <Rail title="Continue Watching" size="continue">
      {history.slice(0, 15).map((h) => {
        const pct = h.duration ? Math.min(100, Math.round(((h.progress ?? 0) / h.duration) * 100)) : 0;
        return (
          <div key={h.slug} className="relative">
            <Link href={dramaPath(h.slug)} className="group block rounded-xl focus-visible:outline-offset-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/5 transition duration-300 group-hover:ring-accent/60">
                <Image src={h.poster} alt={h.title} fill sizes="(max-width: 640px) 42vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="grid size-11 place-items-center rounded-full bg-accent/90 text-accent-ink shadow-lg">
                    <PlayIcon className="ml-0.5 size-5" />
                  </span>
                </span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pb-3 pt-8 text-xs font-semibold">
                  {h.duration && h.progress ? `${Math.max(1, Math.round((h.duration - h.progress) / 60))} min left` : "Resume"}
                </div>
                {pct > 0 && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Watched">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
              <p className="mt-2 line-clamp-1 text-[13px] font-semibold transition-colors group-hover:text-accent-soft">{h.title}</p>
            </Link>
            <button
              type="button"
              onClick={() => removeHistory(h.slug)}
              className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-black/60 backdrop-blur transition-colors hover:bg-black/90"
              aria-label={`Remove ${h.title} from history`}
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        );
      })}
    </Rail>
  );
}
