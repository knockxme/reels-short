import type { DramaCardData } from "@/lib/data";
import { DramaCard } from "./DramaCard";

export function DramaGrid({ items, priorityCount = 6 }: { items: DramaCardData[]; priorityCount?: number }) {
  if (!items.length) {
    return <p className="py-16 text-center text-muted">No dramas found.</p>;
  }
  return (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {items.map((d, i) => (
        <li key={d.id}>
          <DramaCard drama={d} priority={i < priorityCount} headingAs="h2" />
        </li>
      ))}
    </ul>
  );
}
