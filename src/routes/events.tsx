import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo } from "react";
import { PageHero } from "@/components/site/PageHero";
import { EventGrid } from "@/components/site/EventGrid";
import { events, categories, cities } from "@/lib/data";

const schema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["relevance", "soonest", "newest", "price", "popularity"]).optional(),
  free: z.boolean().optional(),
});

export const Route = createFileRoute("/events")({
  validateSearch: (s) => schema.parse(s),
  head: () => ({
    meta: [
      { title: "Events across India — SAC COMMUNITY" },
      { name: "description", content: "Browse and filter sports, music, arts, culture, gaming and festival events across India." },
      { property: "og:title", content: "Events across India — SAC COMMUNITY" },
      { property: "og:description", content: "Filter by category, city, date, price and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

const extraFilters = [
  { name: "Mode", opts: ["Online", "Offline", "Hybrid"] },
  { name: "Audience", opts: ["All ages", "Students", "Professionals", "Families"] },
  { name: "Sport", opts: ["Athletics", "Football", "Kabaddi", "Cricket"] },
  { name: "Arts medium", opts: ["Theatre", "Music", "Visual", "Dance"] },
  { name: "Gaming platform", opts: ["PC", "Mobile", "Console"] },
  { name: "Accessibility", opts: ["Wheelchair access", "Sign language"] },
  { name: "Availability", opts: ["Tickets left", "Waitlist"] },
  { name: "Organizer", opts: ["Verified only"] },
];

function EventsPage() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/events" });
  const set = (patch: Partial<z.infer<typeof schema>>) => navigate({ search: (p) => ({ ...p, ...patch }) });

  const list = useMemo(() => {
    let r = events.filter(
      (e) =>
        (!s.category || e.category === s.category) &&
        (!s.city || e.city === s.city) &&
        (!s.free || e.price === 0) &&
        (!s.q || `${e.name} ${e.city} ${e.category} ${e.organizer}`.toLowerCase().includes(s.q.toLowerCase())),
    );
    if (s.sort === "price") r = [...r].sort((a, b) => a.price - b.price);
    if (s.sort === "newest") r = [...r].reverse();
    return r;
  }, [s]);

  const sel = "w-full border bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary";

  return (
    <>
      <PageHero eyebrow="India → State → City → Area → Venue" title="All events" text="Every sport, stage and celebration — filtered your way." />
      <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-14 md:px-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <input defaultValue={s.q} onKeyDown={(e) => e.key === "Enter" && set({ q: e.currentTarget.value || undefined })} placeholder="Search events, artists, sports..." className={sel} />
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]">Category</p>
            <div className="flex flex-wrap gap-2">
              {["All", ...categories.map((c) => c.name)].map((c) => {
                const active = (c === "All" && !s.category) || s.category === c;
                return (
                  <button key={c} onClick={() => set({ category: c === "All" ? undefined : c })} className={`border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] ${active ? "border-primary bg-primary text-primary-foreground" : ""}`}>{c}</button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]">Location</p>
            <select value={s.city ?? ""} onChange={(e) => set({ city: e.target.value || undefined })} className={sel}>
              <option value="">All India</option>
              {[...new Set([...cities, ...events.map((e) => e.city)])].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]">Date</p>
            <input type="date" className={sel} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={!!s.free} onChange={(e) => set({ free: e.target.checked || undefined })} className="accent-[var(--color-primary)]" /> Free events only
          </label>
          <details className="border-t pt-4">
            <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.2em]">More filters</summary>
            <div className="mt-4 space-y-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Price</p>
                <input type="range" min={0} max={5000} className="w-full accent-[var(--color-primary)]" />
              </div>
              {extraFilters.map((f) => (
                <div key={f.name}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{f.name}</p>
                  {f.opts.map((o) => (
                    <label key={o} className="flex items-center gap-2 py-0.5 text-sm"><input type="checkbox" className="accent-[var(--color-primary)]" /> {o}</label>
                  ))}
                </div>
              ))}
            </div>
          </details>
        </aside>
        <div>
          <div className="mb-8 flex items-center justify-between border-b-2 border-foreground pb-4">
            <p className="font-display text-2xl">{list.length} events</p>
            <select value={s.sort ?? "relevance"} onChange={(e) => set({ sort: e.target.value as never })} className="bg-transparent text-sm font-bold uppercase tracking-widest outline-none">
              {["relevance", "soonest", "newest", "price", "popularity"].map((o) => <option key={o} value={o}>Sort: {o}</option>)}
            </select>
          </div>
          <EventGrid items={list} />
        </div>
      </div>
    </>
  );
}
