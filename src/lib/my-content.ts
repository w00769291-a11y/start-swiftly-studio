import { useSyncExternalStore } from "react";
import { exploreCatalog, YOU, type ExploreItem, type ExploreStory } from "./explore-data";

/**
 * Content the user creates on this device (posts, reels, stories).
 * Persisted in localStorage; created items are also registered in
 * exploreCatalog so the existing Explore post/reel viewers (?post= / ?reel=)
 * can open them without any routing changes.
 */
export type MyContent = { items: ExploreItem[]; stories: ExploreStory[] };

const KEY = "sac-my-content";
const EMPTY: MyContent = { items: [], stories: [] };
let cache: MyContent | null = null;
const listeners = new Set<() => void>();

function load(): MyContent {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<MyContent>;
    return {
      items: Array.isArray(raw.items) ? (raw.items as ExploreItem[]) : [],
      stories: Array.isArray(raw.stories) ? (raw.stories as ExploreStory[]) : [],
    };
  } catch {
    return EMPTY;
  }
}

function registerInCatalog(items: ExploreItem[]) {
  for (const item of [...items].reverse()) {
    if (!exploreCatalog.some((i) => i.id === item.id)) exploreCatalog.unshift(item);
  }
}

function publish(next: MyContent) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked */
  }
  listeners.forEach((l) => l());
}

export function getMyContent(): MyContent {
  if (!cache) {
    cache = load();
    registerInCatalog(cache.items);
  }
  return cache;
}

export function useMyContent(): MyContent {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getMyContent,
    () => EMPTY,
  );
}

export function addMyItem(item: ExploreItem) {
  const cur = getMyContent();
  registerInCatalog([item]);
  publish({ ...cur, items: [item, ...cur.items] });
}

/** Stories expire 24h after creation; expiresAt is an absolute timestamp here. */
export function addMyStory(media: string) {
  const cur = getMyContent();
  const story: ExploreStory = {
    id: `my-story-${Date.now()}`,
    profileId: YOU.id,
    media: [media],
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  publish({ ...cur, stories: [story, ...cur.stories] });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}
