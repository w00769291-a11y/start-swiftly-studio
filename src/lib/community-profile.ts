import { useSyncExternalStore } from "react";

/** The current user's own Community Profile — separate from the Explore social profile and from demo data. */
export type CommunityType = "Athlete" | "Artist / Performer" | "Gamer" | "Club / Team" | "College" | "Organizer" | "Other";
export const COMMUNITY_TYPES: CommunityType[] = ["Athlete", "Artist / Performer", "Gamer", "Club / Team", "College", "Organizer", "Other"];
export const DOMAINS = ["Sports", "Arts", "Culture", "Gaming", "Other"] as const;

export type Achievement = { title: string; event: string; year: string; detail: string };
export type CommunityProfileData = {
  photo?: string | undefined;
  name: string;
  type: CommunityType;
  domain: string;
  city: string;
  about: string;
  /** Type-specific fields keyed by field label. */
  extra: Record<string, string>;
  achievements: Achievement[];
  /** Slugs of existing SAC events associated with this profile. */
  eventSlugs?: string[];
};

export const TYPE_FIELDS: Record<CommunityType, string[]> = {
  Athlete: ["Sport", "Discipline / Event", "Team / Club", "Position / Specialization"],
  "Artist / Performer": ["Art / Performance Discipline", "Talent Type", "Representation / Contact"],
  Gamer: ["Game / Title", "Gaming Role / Discipline", "Team"],
  "Club / Team": ["Club / Team information"],
  College: ["College information", "Activities"],
  Organizer: ["Organization type", "Organization information"],
  Other: [],
};
export const HAS_ACHIEVEMENTS: CommunityType[] = [...COMMUNITY_TYPES];

/** The specific discipline shown next to the type on the public profile. */
export function disciplineOf(p: CommunityProfileData): string {
  const key = { Athlete: "Sport", "Artist / Performer": "Talent Type", Gamer: "Game / Title", Organizer: "Organization type" }[p.type as string];
  return (key && p.extra[key]?.trim()) || p.domain;
}

const KEY = "sac-community-profile";
const EVT = "sac-community-profile-change";
let cacheRaw: string | null = null;
let cache: CommunityProfileData | null = null;

function read(): CommunityProfileData | null {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { /* ignore */ }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try { cache = raw ? JSON.parse(raw) : null; } catch { cache = null; }
  }
  return cache;
}
function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", cb); };
}

export function useCommunityProfile() {
  return useSyncExternalStore(subscribe, read, () => null);
}
export function useHasCommunityProfile() {
  return !!useCommunityProfile();
}
export function saveCommunityProfile(p: CommunityProfileData) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event(EVT));
}
