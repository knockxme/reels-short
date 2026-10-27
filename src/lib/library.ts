"use client";

import { useSyncExternalStore } from "react";

/* Per-device watch history and "My List", kept in localStorage (no login needed). */

export type HistoryItem = {
  slug: string;
  title: string;
  poster: string;
  episode: number;
  progress?: number;
  duration?: number;
  updatedAt: number;
};

export type ListItem = { slug: string; title: string; poster: string; addedAt: number };

const HISTORY_KEY = "df:history";
const LIST_KEY = "df:list";
const EVENT = "df:library";
const EMPTY: never[] = [];
const cache = new Map<string, { raw: string | null; value: unknown[] }>();

function read<T>(key: string): T[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T[];
  let value: T[] = EMPTY;
  try {
    value = raw ? (JSON.parse(raw) as T[]) : EMPTY;
  } catch {}
  cache.set(key, { raw, value });
  return value;
}

function write<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useHistory() {
  return useSyncExternalStore(subscribe, () => read<HistoryItem>(HISTORY_KEY), () => EMPTY as HistoryItem[]);
}

export function useMyList() {
  return useSyncExternalStore(subscribe, () => read<ListItem>(LIST_KEY), () => EMPTY as ListItem[]);
}

export function saveHistory(item: Omit<HistoryItem, "updatedAt">) {
  const all = read<HistoryItem>(HISTORY_KEY);
  const prev = all.find((h) => h.slug === item.slug && h.episode === item.episode);
  // Re-opening the same episode must not wipe its resume position.
  const merged = item.progress === undefined && prev ? { ...item, progress: prev.progress, duration: prev.duration } : item;
  const rest = all.filter((h) => h.slug !== item.slug);
  write(HISTORY_KEY, [{ ...merged, updatedAt: Date.now() }, ...rest].slice(0, 50));
}

export function getProgress(slug: string, episode: number) {
  const h = read<HistoryItem>(HISTORY_KEY).find((x) => x.slug === slug && x.episode === episode);
  return h?.progress ?? 0;
}

export function removeHistory(slug: string) {
  write(HISTORY_KEY, read<HistoryItem>(HISTORY_KEY).filter((h) => h.slug !== slug));
}

export function toggleList(item: Omit<ListItem, "addedAt">) {
  const list = read<ListItem>(LIST_KEY);
  const exists = list.some((l) => l.slug === item.slug);
  write(LIST_KEY, exists ? list.filter((l) => l.slug !== item.slug) : [{ ...item, addedAt: Date.now() }, ...list].slice(0, 200));
  return !exists;
}
