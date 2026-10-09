import { findProfile } from "@/lib/explore-data";
import { useSyncExternalStore } from "react";
import { exploreCatalog, exploreProfiles, exploreStories, type ExploreComment, type ExploreItem, type ExploreProfile, type ExploreStory } from "./explore-data";

/**
 * MOCK service layer for Explore. Every function is async-shaped (200-400ms delay) so it can be
 * swapped for a real backend later without touching the UI. Interactions persist in localStorage
 * under keys prefixed `sac-explore-`.
 */

type State = {
  liked: string[];
  reposts: string[];
  follows: Record<string, boolean>;
  comments: Record<string, ExploreComment[]>;
  commentLikes: string[];
  seenStories: string[];
  seenItems: string[];
  recents: string[];
};
const KEY = "sac-explore-state";
const INITIAL: State = { liked: [], reposts: [], follows: {}, comments: {}, commentLikes: [], seenStories: [], seenItems: [], recents: [] };
let state: State = INITIAL;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...INITIAL, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
}
function commit(patch: Partial<State>) {
  load();
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked */
  }
  listeners.forEach((l) => l());
}
export function useExploreState(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      load();
      return state;
    },
    () => INITIAL,
  );
}

const wait = (min = 200, max = 400) => new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)));
const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

export const profileOf = (handle: string): ExploreProfile | undefined => findProfile(handle);
export const isFollowing = (st: State, id: string) => st.follows[id] ?? profileOf(id)?.following ?? false;
export const allComments = (item: ExploreItem, st: State) => [...item.comments, ...(st.comments[item.id] ?? [])];

// ---- formatting helpers ----
export function abbr(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1e4) return `${Math.round(n / 1e3)}K`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
export function ago(hours = 24) {
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)} hour${Math.floor(hours) === 1 ? "" : "s"} ago`;
  const d = Math.floor(hours / 24);
  return d < 7 ? `${d} day${d === 1 ? "" : "s"} ago` : `${Math.floor(d / 7)} week${Math.floor(d / 7) === 1 ? "" : "s"} ago`;
}
export function toast(message: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("explore-toast", { detail: message }));
}

// ---- seeded, natural-looking feed order ----
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const newSeed = () => Math.floor(Math.random() * 2 ** 31);

const cycles = new Map<string, ExploreItem[]>();
function buildCycle(seed: number, cycle: number): ExploreItem[] {
  const id = `${seed}:${cycle}`;
  const hit = cycles.get(id);
  if (hit) return hit;
  load();
  const r = rng(seed + cycle * 7919 + 1);
  const seen = new Set(cycle === 0 ? state.seenItems : []);
  const pools: Record<"reel" | "post", ExploreItem[]> = {
    reel: exploreCatalog.filter((i) => i.kind === "reel"),
    post: exploreCatalog.filter((i) => i.kind === "post"),
  };
  const out: ExploreItem[] = [];
  let type: "reel" | "post" = r() < 0.5 ? "reel" : "post";
  let run = 0;
  let target = 1 + Math.floor(r() * 4);
  const runs: number[] = [];
  const base = (i: ExploreItem) =>
    1 + Math.min(i.likes / 300, 3) + (isFollowing(state, i.handle) ? 1.5 : 0) + (i.verified ? 0.5 : 0) + Math.max(0, 1 - (i.ageH ?? 24) / 168) + (seen.has(i.id) ? -0.6 : 0.4);

  while (pools.reel.length + pools.post.length > 0) {
    if (run >= target || pools[type].length === 0) {
      if (run > 0) runs.push(run);
      type = type === "reel" ? "post" : "reel";
      run = 0;
      target = 1 + Math.floor(r() * 4);
      // never allow a strict reel/post/reel/post pattern: two runs of 1 in a row forces a longer run
      if (runs.length >= 2 && runs[runs.length - 1] === 1 && runs[runs.length - 2] === 1) target = 2 + Math.floor(r() * 3);
      if (pools[type].length === 0) continue;
    }
    const pool = pools[type];
    const l1 = out[out.length - 1];
    const l2 = out[out.length - 2];
    const weights = pool.map((i) => {
      let w = Math.max(base(i), 0.1);
      if (l1 && l2 && l1.handle === i.handle && l2.handle === i.handle) w = 0.001;
      else if (l1 && l1.handle === i.handle) w *= 0.15;
      if (l1 && l2 && l1.tag === i.tag && l2.tag === i.tag) w *= 0.3;
      return w;
    });
    let roll = r() * weights.reduce((a, b) => a + b, 0);
    let idx = 0;
    for (; idx < weights.length - 1; idx++) {
      roll -= weights[idx] ?? 0;
      if (roll <= 0) break;
    }
    const picked = pool.splice(idx, 1)[0];
    if (picked) {
      out.push(picked);
      run++;
    }
  }
  cycles.set(id, out);
  return out;
}

export type FeedEntry = { key: string; item: ExploreItem };
export async function getFeed({ cursor = 0, seed, limit = 10 }: { cursor?: number; seed: number; limit?: number }): Promise<{ items: FeedEntry[]; nextCursor: number }> {
  await wait();
  const len = exploreCatalog.length;
  const items: FeedEntry[] = [];
  for (let i = cursor; i < cursor + limit; i++) {
    const cycle = Math.floor(i / len);
    const item = buildCycle(seed, cycle)[i % len];
    if (!item) continue;
    items.push({ key: `${item.id}~${cycle}`, item });
  }
  return { items, nextCursor: cursor + limit };
}
export function markItemsSeen(ids: string[]) {
  load();
  const merged = Array.from(new Set([...state.seenItems, ...ids])).slice(-60);
  if (merged.length !== state.seenItems.length) commit({ seenItems: merged });
}

// ---- stories ----
const T0 = Date.now();
export type StoryEntry = { profile: ExploreProfile; story: ExploreStory };
export async function getStories(): Promise<StoryEntry[]> {
  await wait();
  const now = Date.now();
  return exploreStories
    .filter((s) => T0 + s.expiresAt > now)
    .map((story) => ({ story, profile: profileOf(story.profileId)! }))
    .filter((e) => !!e.profile);
}
export function markStorySeen(profileId: string) {
  load();
  if (!state.seenStories.includes(profileId)) commit({ seenStories: [...state.seenStories, profileId] });
}

// ---- profiles & search ----
export async function getSuggestedProfiles(limit = 5): Promise<ExploreProfile[]> {
  await wait();
  load();
  return exploreProfiles.filter((p) => !isFollowing(state, p.id)).slice(0, limit);
}
export async function searchProfiles(query: string): Promise<ExploreProfile[]> {
  await wait();
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q) return [];
  return exploreProfiles.filter((p) => p.username.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)).slice(0, 8);
}
export function addRecent(id: string) {
  load();
  commit({ recents: [id, ...state.recents.filter((x) => x !== id)].slice(0, 8) });
}
export function removeRecent(id: string) {
  load();
  commit({ recents: state.recents.filter((x) => x !== id) });
}
export function clearRecents() {
  commit({ recents: [] });
}

// ---- interactions (optimistic: state updates now, promise resolves after the mock delay) ----
export async function toggleLike(id: string) {
  load();
  commit({ liked: toggle(state.liked, id) });
  await wait();
}
export async function setLiked(id: string, on: boolean) {
  load();
  if (state.liked.includes(id) !== on) commit({ liked: toggle(state.liked, id) });
  await wait();
}
export async function toggleRepost(id: string) {
  load();
  commit({ reposts: toggle(state.reposts, id) });
  await wait();
}
export async function toggleFollow(profileId: string) {
  load();
  commit({ follows: { ...state.follows, [profileId]: !isFollowing(state, profileId) } });
  await wait();
}
export function toggleCommentLike(commentId: string) {
  load();
  commit({ commentLikes: toggle(state.commentLikes, commentId) });
}
export async function getComments(item: ExploreItem): Promise<ExploreComment[]> {
  await wait();
  load();
  return allComments(item, state);
}
export async function addComment(id: string, text: string) {
  load();
  const c: ExploreComment = { id: `u${Date.now()}`, author: "you", text };
  commit({ comments: { ...state.comments, [id]: [...(state.comments[id] ?? []), c] } });
  await wait();
  return c;
}

// ---- follower / following lists (mock, deterministic) ----
/** Sample of accounts that follow `id`. The real count is `ExploreProfile.followers`. */
export function followersOf(id: string, limit = 12): ExploreProfile[] {
  const others = exploreProfiles.filter((p) => p.id !== id);
  const start = [...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % Math.max(1, others.length);
  return [...others.slice(start), ...others.slice(0, start)].slice(0, limit);
}
/** Accounts `id` follows. For the signed-in user this is the live follow state. */
export function followingOf(id: string, st: State, limit = 12): ExploreProfile[] {
  if (id === "you") return exploreProfiles.filter((p) => isFollowing(st, p.id));
  return followersOf(id, limit + 3).reverse().slice(0, Math.min(limit, 8));
}

// ---- reposts by profile (references to original items, never copies) ----
/** Items `id` has reposted. For the signed-in user this is the live repost state; others get a deterministic mock sample. Missing originals are skipped. */
export function repostsOf(id: string, st: State): ExploreItem[] {
  if (id === "you") return [...st.reposts].reverse().map((rid) => exploreCatalog.find((i) => i.id === rid)).filter((i): i is ExploreItem => !!i);
  const others = exploreCatalog.filter((i) => i.handle !== id && !i.id.startsWith("my-"));
  if (!others.length) return [];
  const h = [...id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const count = h % 6;
  const out: ExploreItem[] = [];
  for (let k = 0; out.length < count && k < others.length; k++) {
    const it = others[(h * 7 + k * 5) % others.length];
    if (it && !out.includes(it)) out.push(it);
  }
  return out;
}
