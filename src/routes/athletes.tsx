import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { avatarFor, exploreCatalog, exploreProfiles, exploreStories, type ExploreProfile } from "@/lib/explore-data";
import { BadgesFor } from "@/components/explore/CategoryBadges";

type CommunitySearch = { q?: string | undefined; who?: string | undefined; domain?: string | undefined };

export const Route = createFileRoute("/athletes")({
  validateSearch: (s: Record<string, unknown>): CommunitySearch => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    who: typeof s["who"] === "string" ? s["who"] : undefined,
    domain: typeof s["domain"] === "string" ? s["domain"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Community: athletes, artists & clubs — SAC COMMUNITY" },
      { name: "description", content: "Discover athletes, artists, clubs, colleges and organizers shaping experiences across India." },
      { property: "og:title", content: "Meet the people behind India's experiences — SAC COMMUNITY" },
      { property: "og:description", content: "Discover athletes, artists, clubs, colleges and organizers shaping experiences across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityPage,
});

const WHO = [
  { label: "All", type: undefined },
  { label: "Athletes", type: "Athlete" },
  { label: "Artists", type: "Artist" },
  { label: "Clubs", type: "Club" },
  { label: "Colleges", type: "College" },
  { label: "Organizers", type: "Organizer" },
] as const;

const DOMAINS = [
  { label: "All domains", d: undefined },
  { label: "Sports", d: "Sports" },
  { label: "Arts", d: "Arts" },
  { label: "Culture", d: "Culture" },
  { label: "Gaming", d: "Gaming" },
] as const;

function Chips<T extends string>({ title, items, value, onChange }: { title: string; items: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mt-4 w-full min-w-0 md:mt-5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gold sm:text-[11px]">{title}</p>
      <div role="radiogroup" aria-label={`Filter by ${title.toLowerCase()}`} className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:gap-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {items.map((l) => {
          const on = value === l;
          return (
            <button key={l} type="button" role="radio" aria-checked={on} onClick={() => onChange(l)}
              className={`h-8 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors sm:h-9 sm:px-4 md:h-10 md:px-5 md:text-[12px] md:tracking-[0.16em] ${on ? "border-primary bg-primary text-primary-foreground" : "border-ink-border text-ink-muted hover:border-ink-foreground hover:text-ink-foreground"}`}>
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CommunityPage() {
  // Filters live in the URL so the header Back from a profile restores this exact listing.
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/athletes" });
  const q = search.q ?? "";
  const who = (WHO.find((w) => w.label === search.who)?.label ?? "All") as (typeof WHO)[number]["label"];
  const domain = (DOMAINS.find((d) => d.label === search.domain)?.label ?? "All domains") as (typeof DOMAINS)[number]["label"];
  const upd = (patch: Partial<CommunitySearch>, push = false) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: !push, resetScroll: false });
  const setQ = (v: string) => upd({ q: v || undefined });
  const setWho = (v: string, push = false) => upd({ who: v === "All" ? undefined : v }, push);
  const setDomain = (v: string) => upd({ domain: v === "All domains" ? undefined : v });
  const term = q.trim().toLowerCase();
  const whoType = WHO.find((w) => w.label === who)?.type;
  const dom = DOMAINS.find((x) => x.label === domain)?.d;
  const byWho = exploreProfiles.filter((p) => (!whoType || p.type === whoType) && (!dom || (p.categories ?? []).includes(dom)));
  const list = term
    ? byWho.filter((p) => [p.fullName, p.username, p.type, ...(p.categories ?? [])].some((v) => v.toLowerCase().includes(term)))
    : byWho;
  const showFeatured = !term && !whoType && !dom;
  const featured = pickFeatured(exploreProfiles);

  return (
    <div className="overflow-x-clip">
      <section className="grain relative overflow-hidden bg-ink text-ink-foreground">
        <div className="relative mx-auto w-full max-w-[1480px] px-5 pb-10 pt-24 md:px-8 md:pb-14 md:pt-32">
          <h1 className="max-w-full break-words font-display text-[7.4vw] leading-[1.02] sm:text-[6vw] md:text-[5vw] lg:text-[4.4vw] xl:text-[64px]">
            <span className="block">Meet the people</span>
            <span className="block">behind India's experiences.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
            Discover athletes, artists, clubs, colleges and organizers shaping experiences across India.
          </p>
          <form onSubmit={(e) => e.preventDefault()} role="search" className="mt-5 w-full max-w-md sm:max-w-xl md:mt-6 md:max-w-2xl">
            <label className="flex h-11 w-full min-w-0 items-center gap-2.5 rounded-full border border-ink-border bg-ink-soft px-4 sm:h-12 md:h-14 md:gap-3 md:px-5 text-ink-muted focus-within:border-primary">
              <Search className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search community"
                placeholder="Search people, clubs, colleges & organizers..."
                className="h-full min-w-0 flex-1 truncate bg-transparent text-[13px] sm:text-sm md:text-[15px] text-ink-foreground outline-none placeholder:text-ink-muted"
              />
              {q && (
                <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="grid h-8 w-8 shrink-0 place-items-center hover:text-ink-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
          </form>
          <Chips title="Who" items={WHO.map((w) => w.label)} value={who} onChange={setWho} />
          <Chips title="Domain" items={DOMAINS.map((d) => d.label)} value={domain} onChange={setDomain} />
        </div>
      </section>
      <div className="mx-auto w-full max-w-[1480px] px-5 py-12 md:px-8 md:py-16">
        {list.length === 0 && <p className="py-10 text-center text-[12px] font-bold uppercase tracking-[0.2em] text-muted-foreground">No community profiles found.</p>}
        {showFeatured && featured.length > 0 && <Section title="Featured Community" items={featured} />}
        {SECTIONS.filter((s) => !whoType || s.type === whoType).map((s) => {
          const items = list.filter((p) => p.type === s.type);
          if (items.length === 0) return null;
          return (
            <Section key={s.type} title={s.title} items={items}
              onViewAll={whoType ? undefined : () => { setWho(s.label, true); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          );
        })}
      </div>
    </div>
  );
}

const SECTIONS = [
  { title: "Athletes", type: "Athlete", label: "Athletes" },
  { title: "Artists", type: "Artist", label: "Artists" },
  { title: "Clubs & Teams", type: "Club", label: "Clubs" },
  { title: "Colleges", type: "College", label: "Colleges" },
  { title: "Organizers", type: "Organizer", label: "Organizers" },
] as const;

const TYPE_LABEL: Record<ExploreProfile["type"], string> = { Athlete: "Athlete", Artist: "Artist", Club: "Club / Team", College: "College", Organizer: "Organizer" };

/** Existing image for a profile: its latest post, else its story media. */
function imageOf(id: string): string | undefined {
  return exploreCatalog.find((i) => i.handle === id)?.img ?? exploreStories.find((s) => s.profileId === id)?.media[0] ?? avatarFor(id) ?? undefined;
}

/** Profiles whose Explore content is already marked featured come first; future promotion can plug in here. */
function pickFeatured(all: ExploreProfile[]): ExploreProfile[] {
  const flagged = new Set(exploreCatalog.filter((i) => i.featured).map((i) => i.handle));
  const out: ExploreProfile[] = all.filter((p) => flagged.has(p.id));
  for (const s of SECTIONS) {
    if (out.some((p) => p.type === s.type)) continue;
    const pick = all.filter((p) => p.type === s.type).sort((a, b) => Number(b.verified) - Number(a.verified) || b.followers - a.followers)[0];
    if (pick) out.push(pick);
  }
  return out;
}

function Section({ title, items, onViewAll }: { title: string; items: ExploreProfile[]; onViewAll?: (() => void) | undefined }) {
  const [viewportRef, carousel] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    skipSnaps: false,
    dragFree: false,
    breakpoints: { "(min-width: 640px)": { active: false } },
  });
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!carousel) return;
    const update = () => setActive(carousel.selectedScrollSnap());
    update();
    carousel.on("select", update).on("reInit", update);
    return () => { carousel.off("select", update).off("reInit", update); };
  }, [carousel]);

  return (
    <section className="mb-14 last:mb-0 md:mb-16">
      <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b pb-3">
        <h2 className="truncate font-display text-2xl uppercase sm:text-3xl">{title}</h2>
        {onViewAll && (
          <button type="button" onClick={onViewAll} className="shrink-0 text-[11px] font-bold uppercase tracking-[0.18em] text-primary hover:underline sm:text-[12px]">
            View all →
          </button>
        )}
      </div>
      <div ref={viewportRef} className="overflow-hidden touch-pan-y sm:overflow-visible sm:touch-auto" role="region" aria-label={`${title} cards`} aria-roledescription="carousel">
        <div className="flex gap-5 pb-1 sm:snap-x sm:snap-mandatory sm:gap-4 sm:overflow-x-auto sm:scroll-px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 xl:flex xl:overflow-x-auto">
          {items.map((p) => (
            <div key={p.id} className="flex min-w-0 w-full shrink-0 snap-start sm:w-[48%] sm:min-w-[260px] md:w-[34%] md:min-w-[280px] lg:min-w-0 lg:w-auto lg:shrink xl:w-[calc((100%-4rem)/5)] xl:shrink-0">
              <ProfileCard p={p} />
            </div>
          ))}
        </div>
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex h-2 items-center justify-center gap-2 sm:hidden" role="status" aria-label={`Card ${active + 1} of ${items.length}`}>
          {items.map((p, i) => <span key={p.id} aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${i === active ? "bg-primary" : "bg-muted-foreground/30"}`} />)}
        </div>
      )}
    </section>
  );
}

function ProfileCard({ p }: { p: ExploreProfile }) {
  const img = imageOf(p.id);
  const meta = [TYPE_LABEL[p.type], ...(p.categories ?? [])].join(" · ");
  return (
    <Link to="/community/$handle" params={{ handle: p.id }} className="group flex w-full min-w-0 flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {img ? (
          <img src={img} alt={p.fullName} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 grid place-items-center font-display text-5xl text-muted-foreground">{p.fullName.charAt(0)}</div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 sm:p-4">
        <p className="flex min-w-0 items-center gap-1.5">
          <span className="line-clamp-2 min-w-0 font-display text-base sm:text-lg">{p.fullName}</span>
          <BadgesFor handle={p.id} />
        </p>
        <p className="line-clamp-2 min-w-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{meta}</p>
        <span className="mt-auto whitespace-nowrap pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">View profile →</span>
      </div>
    </Link>
  );
}
