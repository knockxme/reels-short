import Image from "next/image";
import Link from "next/link";
import type { DramaCardData } from "@/lib/data";
import { dramaPath, formatDuration } from "@/lib/site";
import { PlayIcon, StarIcon } from "./icons";

/** Portrait cover card. Every title is one full video, so the corner shows its length, not an episode. */
export function DramaCard({ drama, priority = false, headingAs: Title = "h3" }: { drama: DramaCardData; priority?: boolean; headingAs?: "h2" | "h3" }) {
  const duration = formatDuration(drama.episodes[0]?.durationSec);
  return (
    <Link href={dramaPath(drama.slug)} className="group block rounded-xl focus-visible:outline-offset-4" title={drama.title}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/5 transition duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-black/50 group-hover:ring-accent/60">
        <Image
          src={drama.posterUrl}
          alt={`${drama.title} cover`}
          fill
          sizes="(max-width: 640px) 34vw, (max-width: 1024px) 22vw, 180px"
          className="object-cover transition duration-500 ease-out group-hover:scale-105"
          priority={priority}
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 to-transparent" />
        <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid size-11 place-items-center rounded-full bg-accent/90 text-accent-ink shadow-lg">
            <PlayIcon className="ml-0.5 size-5" />
          </span>
        </span>
        <div className="absolute inset-x-2 bottom-1.5 flex items-center justify-between gap-1 text-xs font-bold">
          {drama.rating ? (
            <span className="flex items-center gap-0.5 text-gold">
              <StarIcon className="size-3.5" /> {drama.rating.toFixed(1)}
            </span>
          ) : (
            <span />
          )}
          {duration && <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] text-white backdrop-blur">{duration}</span>}
        </div>
      </div>
      <Title className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug transition-colors group-hover:text-accent-soft">{drama.title}</Title>
      <p className="mt-0.5 line-clamp-1 text-xs text-muted">{[drama.year, drama.country?.name].filter(Boolean).join(" · ")}</p>
    </Link>
  );
}
