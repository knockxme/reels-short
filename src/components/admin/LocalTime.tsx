"use client";

/** Shows a date in the viewer's own time zone and locale instead of raw UTC. */
export function LocalTime({ date, dateOnly = false }: { date: Date | string; dateOnly?: boolean }) {
  const d = new Date(date);
  const text = dateOnly
    ? d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    // The server renders in its own zone; the browser re-renders in the viewer's zone.
    <time dateTime={d.toISOString()} suppressHydrationWarning>
      {text}
    </time>
  );
}
