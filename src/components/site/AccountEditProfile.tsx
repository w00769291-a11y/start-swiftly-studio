import { useRef, useState, useSyncExternalStore } from "react";
import { Avatar, ResponsiveOverlay } from "@/components/explore/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cropImageFile, saveProfilePhoto, useProfilePhoto } from "@/lib/profile-photo";
import { YOU } from "@/lib/explore-data";
import { toast } from "@/lib/explore-service";

/**
 * Global account-level Edit Profile panel (opened from the header account menu).
 * Its open state is independent of the Explore/Profile pages; it only shares the saved profile data.
 */
const EDIT_KEY = "sac-profile-edit";
export const PROFILE_EDIT_EVENT = "sac-profile-edit-change";

let open = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export function openAccountEditProfile() { open = true; emit(); }
function setOpen(o: boolean) { open = o; emit(); }
function useOpen() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => open, () => false);
}

type Edits = { username?: string; fullName?: string; bio?: string; location?: string };
function load(): Edits {
  try { return JSON.parse(localStorage.getItem(EDIT_KEY) ?? "{}") as Edits; } catch { return {}; }
}

export function AccountEditProfile() {
  const isOpen = useOpen();
  const [photoDraft, setPhotoDraft] = useState<string | null | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const myPhoto = useProfilePhoto();
  const edits = isOpen ? load() : {};
  const fullName = edits.fullName || YOU.fullName;
  const username = edits.username || YOU.username;

  return (
    <ResponsiveOverlay open={isOpen} onOpenChange={(o) => { setOpen(o); if (!o) setPhotoDraft(undefined); }} title="Edit profile">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const u = String(data.get("username") ?? "").trim().replace(/^@/, "").toLowerCase();
          const n = String(data.get("fullName") ?? "").trim();
          const bio = String(data.get("bio") ?? "").trim();
          const location = String(data.get("location") ?? "").trim();
          if (!u || !n) return toast("Name and username are required");
          if (photoDraft !== undefined) {
            try { saveProfilePhoto(photoDraft); } catch { return toast("Couldn't save the photo on this device"); }
          }
          setPhotoDraft(undefined);
          try { localStorage.setItem(EDIT_KEY, JSON.stringify({ username: u, fullName: n, bio, location })); } catch { /* storage blocked */ }
          window.dispatchEvent(new Event(PROFILE_EDIT_EVENT));
          setOpen(false);
          toast("Profile updated");
        }}
        className="max-h-[85dvh] overflow-y-auto p-4"
      >
        <h2 className="pb-3 text-center text-[15px] font-semibold">Edit profile</h2>
        <div className="mb-4 flex flex-col items-center gap-2">
          <Avatar self name={fullName} size={88} src={photoDraft === undefined ? undefined : photoDraft ?? ""} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (!file.type.startsWith("image/")) return toast("Please choose an image file");
              try { setPhotoDraft(await cropImageFile(file)); } catch { toast("Could not read that image"); }
            }}
          />
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="text-[13px] font-semibold text-primary hover:opacity-80">
              Change profile picture
            </button>
            {(photoDraft ?? (photoDraft === undefined ? myPhoto : null)) && (
              <button type="button" onClick={() => setPhotoDraft(null)} className="text-[13px] text-ink-muted hover:opacity-80">Remove</button>
            )}
          </div>
          {photoDraft !== undefined && <p className="text-[11px] text-ink-muted">Preview — press Save to apply</p>}
        </div>
        <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Display name
          <Input name="fullName" defaultValue={fullName} className="mt-1.5 h-10 text-[14px] font-normal normal-case tracking-normal" maxLength={40} />
        </label>
        <label className="mt-3 block text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Username
          <Input name="username" defaultValue={username} className="mt-1.5 h-10 text-[14px] font-normal normal-case tracking-normal" maxLength={30} />
        </label>
        <label className="mt-3 block text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Bio
          <Textarea name="bio" defaultValue={edits.bio ?? ""} className="mt-1.5 min-h-20 text-[14px] font-normal normal-case tracking-normal" maxLength={160} placeholder="Tell people about yourself" />
        </label>
        <label className="mt-3 block text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Location
          <Input name="location" defaultValue={edits.location ?? ""} className="mt-1.5 h-10 text-[14px] font-normal normal-case tracking-normal" maxLength={60} placeholder="City, State" />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setPhotoDraft(undefined); setOpen(false); }} className="h-9 rounded-lg border border-ink-border text-[13px] font-bold uppercase tracking-[0.14em] hover:opacity-80">Cancel</button>
          <button type="submit" className="h-9 rounded-lg bg-primary text-[13px] font-bold uppercase tracking-[0.14em] text-primary-foreground">Save</button>
        </div>
        <p className="mt-2 text-center text-[12px] text-ink-muted">Changes are saved on this device and shown on your mobile profile.</p>
      </form>
    </ResponsiveOverlay>
  );
}
