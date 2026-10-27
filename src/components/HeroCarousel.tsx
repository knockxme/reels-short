"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dramaPath } from "@/lib/site";
import { ChevronLeft, ChevronRight, PlayIcon, StarIcon } from "./icons";

export type HeroItem = {
  slug: string;
  title: string;
  synopsis: string;
  /** Portrait cover; shown as a card over a blurred copy of itself. */
  poster: string;
  meta: string;
  rating: number | null;
  genres: string[];
};

export function HeroCarousel({ items }: { items: HeroItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const go = (i: number) => {
    const el = ref.current;
    if (el) el.scrollTo({ left: ((i + items.length) % items.length) * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || items.length < 2) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length]);

  useEffect(() => {
    const el = ref.current;
    if (!el || items.length < 2 || paused || hovered) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % items.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length, paused, hovered]);

  if (!items.length) return null;

  const ctrl = "grid size-10 place-items-center rounded-full bg-black/40 text-white ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-accent";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured dramas"
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false);
      }}
    >
      <div ref={ref} className="rail flex overflow-x-auto" aria-live={paused ? "polite" : "off"}>
        {items.map((it, i) => (
          <article
            key={it.slug}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}: ${it.title}`}
            className="relative w-full shrink-0 overflow-hidden"
          >
            {/* Blurred copy of the cover fills the width; the sharp cover sits on top as a card. */}
            <Image src={it.poster} alt="" fill sizes="50vw" quality={40} className="scale-125 object-cover opacity-50 blur-2xl" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-bg/30 to-transparent max-md:hidden" />
            <div className="relative mx-auto flex max-w-7xl items-end gap-5 px-4 pb-16 pt-8 sm:gap-10 sm:pb-20 sm:pt-12 md:items-center">
              <Link
                href={dramaPath(it.slug)}
                tabIndex={-1}
                aria-hidden
                className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/15 sm:w-44 md:order-2 md:ml-auto md:w-60 lg:w-72"
              >
                <Image
                  src={it.poster}
                  alt=""
                  fill
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  sizes="(max-width: 640px) 112px, (max-width: 1024px) 240px, 288px"
                  className="object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1 md:max-w-2xl">
              {it.meta && (
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-soft">
                  <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                  {it.meta}
                </p>
              )}
              {i === 0 ? (
                <h1 className="mt-2 text-balance text-2xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">{it.title}</h1>
              ) : (
                <h2 className="mt-2 text-balance text-2xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">{it.title}</h2>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {it.rating ? (
                  <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold ring-1 ring-gold/30">
                    <StarIcon className="size-3.5" /> {it.rating.toFixed(1)}
                  </span>
                ) : null}
                {it.genres.slice(0, 3).map((g) => (
                  <span key={g} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-text/90 ring-1 ring-white/10 backdrop-blur max-sm:hidden">
                    {g}
                  </span>
                ))}
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-text/80 max-sm:hidden sm:line-clamp-3 sm:text-[15px]">{it.synopsis}</p>
              <div className="mt-4 flex gap-3 sm:mt-6">
                <Link href={dramaPath(it.slug)} className="btn btn-lg btn-primary rounded-full max-sm:h-11 max-sm:px-5">
                  <PlayIcon className="size-5" /> Watch Now
                </Link>
              </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {items.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 mx-auto flex max-w-7xl items-center justify-end gap-3 px-4">
          <div className="flex items-center" role="group" aria-label="Choose slide">
            {items.map((it, i) => (
              <button
                key={it.slug}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${it.title}`}
                aria-current={i === active ? "true" : undefined}
                className="grid h-8 place-items-center px-1"
              >
                <span className={`block h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-accent" : "w-1.5 bg-white/40 hover:bg-white/70"}`} />
              </button>
            ))}
          </div>
          <div className="hidden gap-2 sm:flex">
            <button type="button" onClick={() => go(active - 1)} className={ctrl} aria-label="Previous slide">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => setPaused((p) => !p)} className={ctrl} aria-label={paused ? "Play carousel" : "Pause carousel"}>
              {paused ? (
                <PlayIcon className="ml-0.5 size-4" />
              ) : (
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              )}
            </button>
            <button type="button" onClick={() => go(active + 1)} className={ctrl} aria-label="Next slide">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
