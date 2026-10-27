"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { getProgress, saveHistory } from "@/lib/library";
import { PlayIcon, ServerIcon } from "./icons";

export type PlayerSource = { id: number; label: string; type: "IFRAME" | "HLS" | "MP4" | "DAILYMOTION"; url: string };

type Props = {
  sources: PlayerSource[];
  poster: string;
  drama: { slug: string; title: string; poster: string };
  title: string;
};

// Watch history is keyed by slug + part number; every title is a single video, so it is always part 1.
const PART = 1;

const SERVER_PREF_KEY = "df:server";

// Your own player from Dailymotion Partner HQ. Dailymotion may refuse the generic player.html without one.
const DM_PLAYER_ID = process.env.NEXT_PUBLIC_DAILYMOTION_PLAYER_ID ?? "";

function dailymotionSrc(url: string) {
  if (!/^x[a-z0-9]+$/.test(DM_PLAYER_ID)) return url;
  const video = new URL(url).searchParams.get("video");
  return video ? `https://geo.dailymotion.com/player/${DM_PLAYER_ID}.html?video=${video}` : url;
}

/*
 * Vertical (9:16) player. On phones it fills the width; on larger screens its height is capped to the
 * viewport, so the whole frame is visible without scrolling.
 */
// Phones subtract the header, breadcrumb and bottom nav (10.5rem); larger screens only the header and margins.
const frame =
  "relative mx-auto aspect-[9/16] w-full max-w-[min(100%,calc((100dvh-10.5rem)*9/16))] overflow-hidden bg-black md:max-w-[min(100%,calc((100dvh-6rem)*9/16))] sm:rounded-2xl";

export function Player({ sources, poster, drama, title }: Props) {
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const failedIds = useRef(new Set<number>());
  const videoRef = useRef<HTMLVideoElement>(null);
  const source = sources[index];

  function start() {
    // Restore the server the viewer picked last time (by label, e.g. "Server 2").
    let i = 0;
    try {
      i = Math.max(0, sources.findIndex((s) => s.label === localStorage.getItem(SERVER_PREF_KEY)));
    } catch {}
    // Render the <video> synchronously and call play() inside the tap, so iOS Safari treats it as user-initiated.
    flushSync(() => {
      setIndex(i);
      setStarted(true);
    });
    videoRef.current?.play().catch(() => {});
    saveHistory({ slug: drama.slug, title: drama.title, poster: drama.poster, episode: PART });
    try {
      const key = `df:viewed:${drama.slug}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        navigator.sendBeacon?.("/api/view", JSON.stringify({ slug: drama.slug }));
      }
    } catch {}
  }

  function pick(i: number) {
    if (i !== index) failedIds.current.delete(sources[i].id);
    setIndex(i);
    setFailed(false);
    try {
      localStorage.setItem(SERVER_PREF_KEY, sources[i].label);
    } catch {}
  }

  // Auto-switch to the next server that has not failed yet; give up only when every server failed.
  function onError() {
    failedIds.current.add(source.id);
    const next = sources.findIndex((s) => !failedIds.current.has(s.id));
    if (next === -1) setFailed(true);
    else pick(next);
  }

  if (!sources.length) {
    return (
      <div className={`${frame} grid place-items-center bg-surface text-center text-sm text-muted`}>
        <Image src={poster} alt="" fill sizes="(max-width: 640px) 100vw, 420px" className="object-cover opacity-25" />
        <p className="relative px-6">This video is not available yet. Please check back soon.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={frame}>
        {!started ? (
          // Facade: no third-party player loads until the viewer taps. Keeps LCP/INP fast.
          <button type="button" onClick={start} className="group absolute inset-0 h-full w-full" aria-label={`Play ${title}`}>
            <Image src={poster} alt="" fill priority fetchPriority="high" sizes="(max-width: 640px) 100vw, 420px" className="object-cover opacity-80" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
            <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-accent-ink shadow-xl shadow-accent/30 transition group-hover:scale-110 sm:size-20">
              <PlayIcon className="ml-1 size-8 sm:size-10" />
            </span>
            <span className="absolute bottom-3 left-3 right-3 line-clamp-1 text-left text-sm font-semibold">{title}</span>
          </button>
        ) : source.type === "DAILYMOTION" ? (
          // Official Dailymotion player, unsandboxed so its ads, branding and controls work as intended.
          <iframe
            key={source.id}
            src={dailymotionSrc(source.url)}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : source.type === "IFRAME" ? (
          <iframe
            key={source.id}
            src={source.url}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
          />
        ) : (
          <VideoElement
            key={source.id}
            videoRef={videoRef}
            source={source}
            poster={poster}
            resumeFrom={getProgress(drama.slug, PART)}
            onError={onError}
            onProgress={(progress, duration) =>
              saveHistory({ slug: drama.slug, title: drama.title, poster: drama.poster, episode: PART, progress, duration })
            }
          />
        )}

        {failed && (
          <div className="absolute inset-0 grid place-items-center bg-black/85 p-6 text-center text-sm">
            <p>
              {sources.length > 1 ? "All servers failed to load this video." : "This video failed to load."} Please try again later, or report it via the{" "}
              <a className="text-accent-soft underline" href="/contact">contact page</a>.
            </p>
          </div>
        )}
      </div>

      {started && source.type === "DAILYMOTION" && (
        <p className="px-4 pt-2 text-center text-xs text-muted sm:px-0">
          Video not loading?{" "}
          <a
            className="text-accent-soft underline"
            href={`https://www.dailymotion.com/video/${new URL(source.url).searchParams.get("video")}`}
            target="_blank"
            rel="noopener"
          >
            Watch it on Dailymotion ↗
          </a>
        </p>
      )}

      {sources.length > 1 && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto px-4 py-3 sm:px-0" role="group" aria-label="Choose server">
          <ServerIcon className="size-4 shrink-0 text-muted" />
          {sources.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(i)}
              aria-pressed={i === index}
              className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold ring-1 ${i === index ? "bg-accent text-accent-ink ring-accent" : "bg-surface ring-line"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoElement({
  videoRef: ref,
  source,
  poster,
  resumeFrom,
  onError,
  onProgress,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  source: PlayerSource;
  poster: string;
  resumeFrom: number;
  onError: () => void;
  onProgress: (progress: number, duration: number) => void;
}) {
  const lastSave = useRef(0);

  useLayoutEffect(() => {
    const video = ref.current;
    if (!video) return;
    let destroy: (() => void) | undefined;

    if (source.type === "HLS" && !video.canPlayType("application/vnd.apple.mpegurl")) {
      import("hls.js").then(({ default: Hls }) => {
        if (!Hls.isSupported()) return onError();
        // hls.js seeks to startPosition itself; a currentTime set earlier would be overwritten.
        const hls = new Hls({ capLevelToPlayerSize: true, startLevel: -1, startPosition: resumeFrom > 5 ? resumeFrom : -1 });
        hls.loadSource(source.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) onError();
        });
        destroy = () => hls.destroy();
      });
    } else {
      video.src = source.url;
    }
    // Videos are vertical, so fullscreen keeps the phone upright (no landscape lock).
    return () => destroy?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.url, source.type]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full bg-black"
      poster={poster}
      controls
      autoPlay
      playsInline
      preload="metadata"
      onError={onError}
      onLoadedMetadata={(e) => {
        const v = e.currentTarget;
        if (resumeFrom > 5 && resumeFrom < v.duration - 10 && Math.abs(v.currentTime - resumeFrom) > 2) v.currentTime = resumeFrom;
      }}
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        if (Math.abs(v.currentTime - lastSave.current) >= 5) {
          lastSave.current = v.currentTime;
          onProgress(Math.floor(v.currentTime), Math.floor(v.duration || 0));
        }
      }}
    />
  );
}
