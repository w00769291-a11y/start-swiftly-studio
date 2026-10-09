import { useSyncExternalStore } from "react";

// Connection flow (saved on this device):
// - You tap Connect on someone → request sent ("Requested"); they see it under "connection".
// - When they approve → you are "Connected" to them.
// - When both sides are connected to each other → it counts as a mutual "Connect".
export type ConnState = {
  sent: string[]; // you → them, pending
  outgoing: string[]; // you → them, approved
  incoming: string[]; // them → you, pending (needs your approval)
  approved: string[]; // them → you, approved by you
};

const KEY = "sac-connections";
const SEED: ConnState = { sent: [], outgoing: [], incoming: ["terracecrew", "jaipurlights", "openwall"], approved: [] };
let state: ConnState = SEED;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...SEED, ...(JSON.parse(raw) as ConnState) };
  } catch {
    /* ignore */
  }
}
function set(next: ConnState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}
const without = (l: string[], id: string) => l.filter((x) => x !== id);

export function useConnections() {
  return useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      l();
      return () => listeners.delete(l);
    },
    () => state,
    () => SEED,
  );
}

export type ConnStatus = "none" | "requested" | "connected" | "mutual";
export function statusWith(s: ConnState, id: string): ConnStatus {
  if (s.outgoing.includes(id)) return s.approved.includes(id) ? "mutual" : "connected";
  if (s.sent.includes(id)) return "requested";
  return "none";
}

export function sendRequest(id: string) {
  if (state.sent.includes(id) || state.outgoing.includes(id)) return;
  set({ ...state, sent: [...state.sent, id] });
  // Demo: the other person approves shortly after.
  setTimeout(() => {
    if (!state.sent.includes(id)) return;
    set({ ...state, sent: without(state.sent, id), outgoing: [...state.outgoing, id] });
  }, 4000);
}
export function cancelOrRemove(id: string) {
  set({ ...state, sent: without(state.sent, id), outgoing: without(state.outgoing, id) });
}
export function approveRequest(id: string) {
  set({ ...state, incoming: without(state.incoming, id), approved: [...state.approved, id] });
}
export function declineRequest(id: string) {
  set({ ...state, incoming: without(state.incoming, id) });
}
export function mutualOf(s: ConnState) {
  return s.outgoing.filter((id) => s.approved.includes(id));
}
