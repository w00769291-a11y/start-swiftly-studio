import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  COMMUNITY_TYPES, DOMAINS, HAS_ACHIEVEMENTS, TYPE_FIELDS,
  saveCommunityProfile, useCommunityProfile,
  type Achievement, type CommunityProfileData, type CommunityType,
} from "@/lib/community-profile";
import { cropImageFile } from "@/lib/profile-photo";
import { cn } from "@/lib/utils";
import { events } from "@/lib/data";

export const Route = createFileRoute("/community-profile")({
  head: () => ({
    meta: [
      { title: "Community Profile editor — SAC COMMUNITY" },
      { name: "description", content: "Create or manage your public SAC Community Profile." },
      { property: "og:title", content: "Community Profile editor — SAC COMMUNITY" },
      { property: "og:description", content: "Create or manage your public SAC Community Profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityProfileEditor,
});

const input = "mt-1.5 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-[15px] outline-none focus:border-primary";
const label = "block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground";

function CommunityProfileEditor() {
  const saved = useCommunityProfile();
  const navigate = useNavigate();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [photo, setPhoto] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [type, setType] = useState<CommunityType | "">("");
  const [domain, setDomain] = useState("");
  const [city, setCity] = useState("");
  const [about, setAbout] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [ach, setAch] = useState<Achievement[]>([]);
  const [evs, setEvs] = useState<string[]>([]);

  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    if (!saved) return;
    setPhoto(saved.photo); setName(saved.name); setType(saved.type); setDomain(saved.domain);
    setCity(saved.city); setAbout(saved.about); setExtra(saved.extra ?? {}); setAch(saved.achievements ?? []); setEvs(saved.eventSlugs ?? []);
  }, [saved, loaded]);

  const close = () => (window.history.length > 1 ? router.history.back() : navigate({ to: "/my-sac" }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type || !domain) return window.alert("Please add your name, profile type and domain.");
    const fields = TYPE_FIELDS[type];
    const data: CommunityProfileData = {
      photo, name: name.trim().slice(0, 80), type, domain, city: city.trim().slice(0, 60), about: about.trim().slice(0, 1000),
      extra: Object.fromEntries(fields.map((f) => [f, (extra[f] ?? "").trim().slice(0, 200)])),
      achievements: HAS_ACHIEVEMENTS.includes(type) ? ach.filter((a) => a.title.trim()) : [],
      eventSlugs: evs.filter((s) => events.some((e) => e.slug === s)),
    };
    try { saveCommunityProfile(data); } catch { return window.alert("Could not save on this device (photo may be too large)."); }
    navigate({ to: "/community/$handle", params: { handle: "you" }, replace: true });
  };

  const setA = (i: number, k: keyof Achievement, v: string) => setAch((l) => l.map((a, j) => (j === i ? { ...a, [k]: v } : a)));

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-background px-4 pb-16 pt-20 text-foreground">
      <form onSubmit={submit} className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between gap-3 py-4">
          <h1 className="min-w-0 font-display text-2xl sm:text-3xl">{saved ? "Manage Community Profile" : "Create Community Profile"}</h1>
          <button type="button" onClick={close} aria-label="Close" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border hover:text-primary"><X className="h-5 w-5" /></button>
        </div>

        <section className="space-y-4 rounded-xl border border-border p-4 sm:p-6">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-primary">Basic information</h2>
          <div className="flex flex-wrap items-center gap-4">
            {photo ? <img src={photo} alt="" className="h-20 w-20 rounded-full object-cover" /> : <div className="h-20 w-20 rounded-full bg-muted" />}
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-border px-4 text-[12px] font-bold uppercase tracking-[0.12em] hover:border-primary">
              {photo ? "Change photo" : "Add photo"}
              <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await cropImageFile(f)); }} />
            </label>
            {photo && <button type="button" onClick={() => setPhoto(undefined)} className="text-[12px] text-muted-foreground underline">Remove</button>}
          </div>
          <div><label className={label}>Display name *</label><input className={input} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></div>
          <div>
            <span className={label}>Community Profile type *</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMUNITY_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} aria-pressed={type === t}
                  className={cn("min-h-10 rounded-full border px-4 text-[13px] font-semibold", type === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")}>{t}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Domain / Category *</label>
              <select className={input} value={domain} onChange={(e) => setDomain(e.target.value)}>
                <option value="">Select…</option>
                {DOMAINS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label className={label}>City</label><input className={input} value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} /></div>
          </div>
          <div><label className={label}>About</label><textarea className={cn(input, "min-h-28")} value={about} maxLength={1000} onChange={(e) => setAbout(e.target.value)} /></div>
        </section>

        {type && TYPE_FIELDS[type].length > 0 && (
          <section className="mt-5 space-y-4 rounded-xl border border-border p-4 sm:p-6">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-primary">{type} details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {TYPE_FIELDS[type].map((f) => (
                <div key={f}><label className={label}>{f}</label>
                  <input className={input} value={extra[f] ?? ""} maxLength={200} placeholder={f === "Talent Type" ? "Singer, Dancer, Musician, Actor…" : undefined} onChange={(e) => setExtra({ ...extra, [f]: e.target.value })} />
                </div>
              ))}
            </div>
          </section>
        )}

        {type && HAS_ACHIEVEMENTS.includes(type) && (
          <section className="mt-5 space-y-4 rounded-xl border border-border p-4 sm:p-6">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-primary">Achievements</h2>
            {ach.map((a, i) => (
              <div key={i} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
                <input className={input} placeholder="Achievement title" value={a.title} maxLength={120} onChange={(e) => setA(i, "title", e.target.value)} />
                <input className={input} placeholder="Event / Competition" value={a.event} maxLength={120} onChange={(e) => setA(i, "event", e.target.value)} />
                <input className={input} placeholder="Year or date" value={a.year} maxLength={30} onChange={(e) => setA(i, "year", e.target.value)} />
                <input className={input} placeholder="Result / short description" value={a.detail} maxLength={200} onChange={(e) => setA(i, "detail", e.target.value)} />
                <button type="button" onClick={() => setAch(ach.filter((_, j) => j !== i))} className="inline-flex min-h-10 items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary sm:col-span-2"><Trash2 className="h-4 w-4" />Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => setAch([...ach, { title: "", event: "", year: "", detail: "" }])} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-4 text-[12px] font-bold uppercase tracking-[0.12em] hover:border-primary"><Plus className="h-4 w-4" />Add achievement</button>
          </section>
        )}

        <section className="mt-5 space-y-4 rounded-xl border border-border p-4 sm:p-6">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-primary">Upcoming events</h2>
          {evs.map((slug) => { const e = events.find((x) => x.slug === slug); if (!e) return null; return (
            <div key={slug} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{e.name}</p><p className="text-[12px] uppercase tracking-[0.1em] text-muted-foreground">{e.date} · {e.city}</p></div>
              <button type="button" onClick={() => setEvs(evs.filter((s) => s !== slug))} aria-label={`Remove ${e.name}`} className="grid h-10 w-10 shrink-0 place-items-center text-muted-foreground hover:text-primary"><Trash2 className="h-4 w-4" /></button>
            </div>); })}
          <select className={input} value="" onChange={(e) => e.target.value && setEvs([...evs, e.target.value])}>
            <option value="">+ Add an existing SAC event…</option>
            {events.filter((e) => !evs.includes(e.slug)).map((e) => <option key={e.slug} value={e.slug}>{e.name} — {e.date}</option>)}
          </select>
        </section>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={close} className="min-h-11 rounded-lg border border-border px-6 text-[12px] font-bold uppercase tracking-[0.14em]">Cancel</button>
          <button type="submit" className="min-h-11 rounded-lg bg-primary px-6 text-[12px] font-bold uppercase tracking-[0.14em] text-primary-foreground">Save profile</button>
        </div>
      </form>
    </div>
  );
}
