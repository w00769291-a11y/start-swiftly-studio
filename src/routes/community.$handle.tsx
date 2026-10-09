import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { BadgesFor } from "@/components/explore/CategoryBadges";
import { Avatar } from "@/components/explore/shared";
import { YOU, avatarFor, exploreCatalog, exploreStories, findProfile, type ExploreProfile } from "@/lib/explore-data";
import { isFollowing, toggleFollow, useExploreState } from "@/lib/explore-service";
import { events } from "@/lib/data";
import { cn } from "@/lib/utils";
import { disciplineOf, useCommunityProfile } from "@/lib/community-profile";

/**
 * Community profile: WHO a person/organization is. Same underlying account
 * as the Explore profile (/u/$handle) — same data, Follow state and editor.
 */
export const Route = createFileRoute("/community/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} — Community profile | SAC COMMUNITY` },
      { name: "description", content: `About, achievements and upcoming events for ${params.handle} on SAC COMMUNITY.` },
      { property: "og:title", content: `${params.handle} — Community profile | SAC COMMUNITY` },
      { property: "og:description", content: `About, achievements and upcoming events for ${params.handle} on SAC COMMUNITY.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityProfile,
});

const TYPE_LABEL: Record<ExploreProfile["type"], string> = { Athlete: "Athlete", Artist: "Artist", Club: "Club / Team", College: "College", Organizer: "Organizer" };

/** The signed-in (mock) account's id. Ownership is decided by account id, never by display name. */
const CURRENT_USER_ID = YOU.id;

function imageOf(id: string): string | undefined {
  return exploreCatalog.find((i) => i.handle === id)?.img ?? exploreStories.find((s) => s.profileId === id)?.media[0] ?? avatarFor(id) ?? undefined;
}

function CommunityProfile() {
  const { handle } = Route.useParams();
  const st = useExploreState();
  const base = handle === CURRENT_USER_ID ? YOU : findProfile(handle);
  const isOwner = !!base && base.id === CURRENT_USER_ID;
  const own = useCommunityProfile();

  if (!base) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-ink px-5 pt-20 text-center text-ink-foreground">
        <div>
          <h1 className="font-display text-4xl">Profile not found</h1>
          <p className="mt-2 text-sm text-ink-muted">We couldn't find “{handle}” in the community.</p>
          <Link to="/athletes" className="mt-6 inline-flex h-11 items-center bg-primary px-5 text-[12px] font-bold uppercase tracking-[0.14em] text-primary-foreground">Browse community</Link>
        </div>
      </div>
    );
  }

  // Owner: only their own saved Community Profile — never demo data or an assumed type.
  const p = isOwner
    ? { ...base, fullName: own?.name || base.fullName, about: own?.about || undefined, city: own?.city || undefined, eventSlugs: own?.eventSlugs ?? [],
        achievements: (own?.achievements ?? []).map((a) => [a.title, a.event, a.year, a.detail].filter(Boolean).join(" · ")) }
    : base;
  const on = isFollowing(st, p.id);
  const img = isOwner ? own?.photo : imageOf(p.id);
  const discipline = isOwner
    ? (own ? [...new Set([own.type, disciplineOf(own), own.domain].filter(Boolean))].join(" · ") : "")
    : [TYPE_LABEL[p.type], ...(p.categories ?? [])].join(" · ");
  const upcoming = (p.eventSlugs ?? []).map((s) => events.find((e) => e.slug === s)).filter((e): e is NonNullable<typeof e> => !!e);
  const h = "font-display text-lg uppercase sm:text-2xl";

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-ink pb-16 pt-[calc(3.5rem+env(safe-area-inset-top))] text-ink-foreground">
      <div className="mx-auto w-full max-w-[960px] px-5 pt-6 md:px-8 md:pt-10">
        <section className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7">
          <div className="aspect-square h-24 w-24 flex-none shrink-0 grow-0 self-start overflow-hidden rounded-full border-2 border-ink-border sm:h-32 sm:w-32 sm:self-center [&>*]:!h-full [&>*]:!w-full [&>*]:rounded-full">
            {img ? <img src={img} alt={p.fullName} className="h-full w-full object-cover" /> : <Avatar self={isOwner} name={p.fullName} size={128} />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="flex min-w-0 flex-wrap items-center gap-2 break-words font-display text-2xl leading-tight sm:text-4xl md:text-5xl">
              <span className="min-w-0">{p.fullName}</span>
              <BadgesFor handle={p.id} />
            </h1>
            {discipline && <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold sm:text-[12px]">{discipline}</p>}
            {p.city && <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-muted sm:text-[14px]"><MapPin className="h-4 w-4" />{p.city}</p>}
            <div className="mt-4">
              {isOwner ? (
                <Link to="/community-profile" className="inline-flex h-10 items-center rounded-lg bg-ink-soft px-6 text-[12px] font-bold uppercase tracking-[0.14em] hover:opacity-80">
                  {own ? "Manage Community Profile" : "Create Community Profile"}
                </Link>
              ) : (
                <button onClick={() => void toggleFollow(p.id)} aria-pressed={on} className={cn("h-10 rounded-lg px-7 text-[12px] font-bold uppercase tracking-[0.14em]", on ? "bg-ink-soft" : "bg-primary text-primary-foreground")}>
                  {on ? "Connected" : "Connect"}
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="mt-10 space-y-10 break-words">
          {p.about && (
            <section>
              <h2 className={h}>About</h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-foreground/85">{p.about}</p>
            </section>
          )}
          {!!p.achievements?.length && (
            <section>
              <h2 className={h}>Achievements</h2>
              <ul className="mt-3 space-y-2">
                {p.achievements.map((a) => <li key={a} className="border-l-2 border-primary pl-3 text-[15px] text-ink-foreground/90">{a}</li>)}
              </ul>
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              <h2 className={h}>Upcoming events</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {upcoming.map((e) => (
                  <li key={e.slug} className="rounded-lg border border-ink-border p-4">
                    <p className="text-[15px] font-semibold">{e.name}</p>
                    <p className="mt-1 text-[12px] uppercase tracking-[0.1em] text-ink-muted">{e.date} · {e.city}</p>
                    <Link to="/event/$slug" params={{ slug: e.slug }} className="mt-3 inline-block text-[12px] font-bold uppercase tracking-[0.14em] text-primary">View event →</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!p.about && !p.achievements?.length && upcoming.length === 0 && (
            <p className="text-[14px] text-ink-muted">{isOwner ? "Your community profile is empty. Create your Community Profile to add your details." : "No further details shared yet."}</p>
          )}
        </div>
      </div>
    </div>
  );
}
