import type { Metadata } from "next";
import { ContinueWatching } from "@/components/ContinueWatching";
import { MyListGrid } from "@/components/MyListGrid";

export const metadata: Metadata = {
  title: "My List",
  robots: { index: false, follow: false },
};

export default function MyListPage() {
  return (
    <div className="pt-4">
      <ContinueWatching />
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="mb-4 mt-8 text-2xl font-extrabold">My List</h1>
        <MyListGrid />
      </div>
    </div>
  );
}
