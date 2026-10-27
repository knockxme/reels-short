"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "./icons";

const widths = {
  poster: "[&>*]:w-[31%] sm:[&>*]:w-[22%] md:[&>*]:w-[16%] lg:[&>*]:w-[12.5%]",
  wide: "[&>*]:w-[62%] sm:[&>*]:w-[36%] md:[&>*]:w-[24%] lg:[&>*]:w-[19%]",
  continue: "[&>*]:w-[42%] sm:[&>*]:w-[24%] md:[&>*]:w-[18%] lg:[&>*]:w-[14%]",
};

export function Rail({
  title,
  href,
  children,
  as: Heading = "h2",
  size = "poster",
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
  as?: "h2" | "h3";
  size?: keyof typeof widths;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow =
    "absolute top-0 z-10 hidden h-full w-12 items-center justify-center transition-opacity duration-200 md:flex disabled:pointer-events-none disabled:opacity-0";

  return (
    <section className="mx-auto mt-10 max-w-7xl">
      <div className="mb-3 flex items-center justify-between px-4">
        <Heading className="section-title">{title}</Heading>
        {href && (
          <Link href={href} className="flex h-10 items-center gap-0.5 rounded-lg pl-3 text-sm font-medium text-muted transition-colors hover:text-accent-soft">
            See all <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
      <div className="group/rail relative">
        <div ref={ref} className={`rail flex gap-3 overflow-x-auto px-4 pb-1 [&>*]:shrink-0 ${widths[size]}`}>
          {children}
        </div>
        <button
          type="button"
          onClick={() => page(-1)}
          disabled={edge.start}
          aria-label={`Scroll ${title} left`}
          className={`${arrow} left-0 bg-gradient-to-r from-bg via-bg/70 to-transparent`}
        >
          <span className="grid size-10 place-items-center rounded-full bg-surface-2/90 ring-1 ring-line transition-colors hover:bg-accent">
            <ChevronLeft className="size-5" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => page(1)}
          disabled={edge.end}
          aria-label={`Scroll ${title} right`}
          className={`${arrow} right-0 bg-gradient-to-l from-bg via-bg/70 to-transparent`}
        >
          <span className="grid size-10 place-items-center rounded-full bg-surface-2/90 ring-1 ring-line transition-colors hover:bg-accent">
            <ChevronRight className="size-5" />
          </span>
        </button>
      </div>
    </section>
  );
}
