import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { PlayIcon } from "./icons";

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight" aria-label={`${SITE_NAME} home`}>
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent-soft to-accent text-accent-ink shadow-md shadow-accent/30">
        <PlayIcon className="size-4" />
      </span>
      {SITE_NAME}
    </Link>
  );
}
