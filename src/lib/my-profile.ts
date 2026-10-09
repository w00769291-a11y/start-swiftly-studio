import { useSyncExternalStore } from "react";
import { useProfilePhoto } from "@/lib/profile-photo";

/** Fixed hue for the signed-in user's avatar, derived once from the account id "you". */
export const MY_HUE = [..."you"].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7);

const EDIT_KEY = "sac-profile-edit";
const EVENTS = ["sac-profile-edit-change", "sac-profile-photo-change", "storage"];

function readName(): string {
  try {
    const n = (JSON.parse(localStorage.getItem(EDIT_KEY) ?? "{}") as { fullName?: string }).fullName?.trim();
    return n || "You";
  } catch {
    return "You";
  }
}
function subscribe(cb: () => void) {
  EVENTS.forEach((e) => window.addEventListener(e, cb));
  return () => EVENTS.forEach((e) => window.removeEventListener(e, cb));
}

export function useMyProfile() {
  const name = useSyncExternalStore(subscribe, readName, () => "You");
  const photo = useProfilePhoto();
  return { name, photo, initial: name[0]?.toUpperCase() ?? "Y", hue: MY_HUE };
}
