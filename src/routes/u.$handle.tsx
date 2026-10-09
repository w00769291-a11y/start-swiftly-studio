import { CreateContent } from "@/components/account/CreateContent";
import { useAccount } from "@/lib/account";
import { useCommunityContent, asExploreItem } from "@/lib/community-content";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Ban, Flag, Link2, ShieldOff, Bookmark, Clapperboard, Grid3x3, Images, MoreVertical, Plus, Share2, Ticket } from "lucide-react";
import "@/components/explore/explore.css";
import { BadgesFor } from "@/components/explore/CategoryBadges";
import { Avatar, ResponsiveOverlay } from "@/components/explore/shared";
import { StoryViewer } from "@/components/explore/Viewers";
import { openAccountEditProfile } from "@/components/site/AccountEditProfile";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { YOU, exploreCatalog, findProfile, type ExploreItem, type ExploreProfile, type ExploreStory } from "@/lib/explore-data";
import { addMyItem, addMyStory, readFileAsDataUrl, useMyContent } from "@/lib/my-content";
import { abbr, followersOf, followingOf, getStories, isFollowing, toast, toggleFollow, useExploreState, type StoryEntry } from "@/lib/explore-service";
import { useSaved } from "@/lib/saved";
import { cn } from "@/lib/utils";
import { events } from "@/lib/data";

export const Route = createFileRoute("/u/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} — SAC Community` },
      { name: "description", content: `Posts, reels and events from ${params.handle} on SAC Community.` },
      { property: "og:title", content: `${params.handle} — SAC Community` },
      { property: "og:description", content: `Posts, reels and events from ${params.handle} on SAC Community.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { edit?: 1 | undefined } => ({ edit: s["edit"] === 1 || s["edit"] === "1" ? 1 : undefined }),
  component: ProfileRoute,
});

type ListKind = "followers" | "following";

type ProfileEdits = { username: string; fullName: string; bio: string; location: string };
const EDIT_KEY = "sac-profile-edit";

function loadProfileEdits(): Partial<ProfileEdits> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(EDIT_KEY) ?? "{}") as Partial<ProfileEdits>;
  } catch {
    return {};
  }
}

function ProfileRoute() {
  const { handle } = Route.useParams();
  const st = useExploreState();
  const [list, setList] = useState<ListKind | null>(null);
  const profile: ExploreProfile | undefined = handle === "you" ? YOU : findProfile(handle);
  const isYou = handle === "you";

  if (!profile) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-ink px-5 pt-20 text-center text-ink-foreground">
        <div>
          <h1 className="font-display text-4xl">Profile not found</h1>
          <p className="mt-2 text-sm text-ink-muted">We couldn't find an account called “{handle}”.</p>
          <Link to="/explore" className="mt-6 inline-flex h-11 items-center bg-primary px-5 text-[12px] font-bold uppercase tracking-[0.14em] text-primary-foreground">Back to Explore</Link>
        </div>
      </div>
    );
  }

  const posts = exploreCatalog.filter((i) => i.handle === profile.id);
  const following = followingOf(profile.id, st);
  const followers = isYou ? [] : followersOf(profile.id);
  const followerCount = isYou ? 0 : profile.followers + (isFollowing(st, profile.id) && !profile.following ? 1 : 0);
  const followingCount = following.length;
  const on = isFollowing(st, profile.id);

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-ink pb-16 pt-[calc(3.5rem+env(safe-area-inset-top))] text-ink-foreground">
      <MobileProfile profile={profile} isYou={isYou} posts={posts} followerCount={followerCount} followingCount={followingCount} on={on} onList={setList} />
      <MobileProfile desktop profile={profile} isYou={isYou} posts={posts} followerCount={followerCount} followingCount={followingCount} on={on} onList={setList} />

      <ResponsiveOverlay open={list !== null} onOpenChange={(o) => !o && setList(null)} title={list === "following" ? "Connected" : "Connections"}>
        <div className="flex max-h-[70dvh] min-h-0 flex-col">
          <h2 className="border-b border-ink-border px-4 py-3 text-center text-[15px] font-semibold capitalize">{list}</h2>
          <ul className="min-h-0 flex-1 overflow-y-auto py-2">
            {(list === "following" ? following : followers).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2">
                <Avatar name={p.fullName} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-[14px] font-semibold">
                    <Link to="/u/$handle" params={{ handle: p.id }} onClick={() => setList(null)} className="min-w-0 truncate hover:opacity-80">{p.username}</Link>
                    <BadgesFor handle={p.id} />
                  </p>
                  <p className="truncate text-[13px] text-ink-muted">{p.fullName}</p>
                </div>
              </li>
            ))}
            {(list === "following" ? following : followers).length === 0 && (
              <li className="px-4 py-10 text-center text-[14px] text-ink-muted">{list === "following" ? "You aren't connected with anyone yet." : "No connections yet."}</li>
            )}
          </ul>
        </div>
      </ResponsiveOverlay>
    </div>
  );
}

type Tab = "posts" | "reels" | "saved";

function ProfileDetails({ profile, desktop }: { profile: ExploreProfile; desktop: boolean }) {
  if (!profile.about && !profile.city && !profile.achievements?.length && !profile.eventSlugs?.length) return null;
  const evs = (profile.eventSlugs ?? []).map((s) => events.find((e) => e.slug === s)).filter((e): e is NonNullable<typeof e> => !!e);
  const h = "text-[11px] font-bold uppercase tracking-[0.16em] text-ink-muted";
  return (
    <section className={cn("mt-5 space-y-5 break-words", desktop ? "max-w-[640px]" : "px-4")}>
      {profile.city && <p className="text-[14px] text-ink-foreground/80">{profile.type} · {profile.city}</p>}
      {profile.about && (
        <div>
          <h2 className={h}>About</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-foreground/90">{profile.about}</p>
        </div>
      )}
      {!!profile.achievements?.length && (
        <div>
          <h2 className={h}>Achievements</h2>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[15px] text-ink-foreground/90">
            {profile.achievements.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </div>
      )}
      {evs.length > 0 && (
        <div>
          <h2 className={h}>Upcoming events</h2>
          <ul className="mt-2 space-y-2">
            {evs.map((e) => (
              <li key={e.slug} className="rounded-lg border border-ink-soft p-3">
                <p className="text-[15px] font-semibold">{e.name}</p>
                <p className="mt-0.5 text-[12px] uppercase tracking-[0.1em] text-ink-muted">{e.date} · {e.city}</p>
                <Link to="/event/$slug" params={{ slug: e.slug }} className="mt-2 inline-block text-[12px] font-bold uppercase tracking-[0.14em] text-primary">View event →</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Stat({ n, label, onClick }: { n: string | number; label: string; onClick?: () => void }) {
  const inner = (
    <>
      <b className="block text-[15px] font-bold leading-tight">{n}</b>
      <span className="mt-0.5 block text-[11px] capitalize leading-tight text-ink-muted">{label}</span>
    </>
  );
  return onClick ? <button onClick={onClick} className="min-w-0 text-center">{inner}</button> : <div className="min-w-0 text-center">{inner}</div>;
}

function ProfileEmptyState({ tab, isYou, onCreate }: { tab: Tab; isYou: boolean; onCreate: () => void }) {
  const Icon = tab === "saved" ? Bookmark : tab === "reels" ? Clapperboard : Grid3x3;
  const title = tab === "saved" ? "Nothing saved yet." : tab === "reels" ? "No reels yet." : isYou ? "You haven't posted yet." : "No posts yet.";
  return (
    <div className="mx-auto flex w-full max-w-[280px] flex-col items-center px-4 py-14 text-center sm:max-w-[320px] sm:py-20">
      <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink-soft text-ink-muted">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[14px] leading-snug text-ink-muted">{title}</p>
      {tab === "posts" && isYou && (
        <button onClick={onCreate} className="mt-5 flex h-9 items-center gap-1.5 rounded-lg bg-primary px-5 text-[13px] font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-foreground">
          <Plus className="h-4 w-4" /> Create post
        </button>
      )}
    </div>
  );
}

function MobileProfile({ profile, isYou, posts, followerCount, followingCount, on, onList, desktop = false }: { profile: ExploreProfile; isYou: boolean; posts: ExploreItem[]; followerCount: number; followingCount: number; on: boolean; onList: (k: ListKind) => void; desktop?: boolean }) {
  const st = useExploreState();
  const account = useAccount();
  const cloudContent = useCommunityContent();
  const saved = useSaved();
  const [tab, setTab] = useState<Tab>("posts");
  const [stories, setStories] = useState<StoryEntry[]>([]);
  const [viewer, setViewer] = useState<number | null>(null);
  const [create, setCreate] = useState(false);

  const my = useMyContent();
  const mod = useMod();
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const restricted = !isYou && mod.restricted.includes(profile.id);
  const blocked = !isYou && mod.blocked.includes(profile.id);
  const [edits, setEdits] = useState<Partial<ProfileEdits>>({});
  useEffect(() => {
    void getStories().then(setStories);
  }, []);
  useEffect(() => {
    setEdits(loadProfileEdits());
    const sync = () => setEdits(loadProfileEdits());
    window.addEventListener("sac-profile-edit-change", sync);
    return () => window.removeEventListener("sac-profile-edit-change", sync);
  }, []);
  // Opened from My SAC "Edit Profile" (?edit=1): open the existing editor straight away.
  // Only the instance visible at this screen size responds, so exactly one editor opens;
  // the flag is then cleared (replace) so closing stays on this profile.
  const wantEdit = Route.useSearch().edit;
  const navigate = Route.useNavigate();
  useEffect(() => {
    if (!isYou || !wantEdit || window.matchMedia("(min-width: 640px)").matches !== desktop) return;
    openAccountEditProfile();
    void navigate({ search: {}, replace: true, resetScroll: false });
  }, [isYou, wantEdit, desktop, navigate]);
  const myStoryEntries = my.stories.filter((s) => s.expiresAt > Date.now()).map((story) => ({ story, profile: YOU }));
  const profileStories = [...myStoryEntries, ...stories].filter((entry) => entry.profile.id === profile.id);
  const hasActiveStory = profileStories.length > 0;
  const view = {
    ...profile,
    ...(isYou && edits.username ? { username: edits.username } : null),
    ...(isYou && edits.fullName ? { fullName: edits.fullName } : null),
    bio: isYou ? edits.bio : undefined,
    location: isYou ? account.profile?.location ?? edits.location : undefined,
    ...(isYou && account.profile ? { username: account.profile.username, fullName: account.profile.full_name, bio: account.profile.bio } : {}),
  } as ExploreProfile & { bio?: string; location?: string };
  const savedItems = exploreCatalog.filter((i) => saved.includes(`explore:${i.id}`));
  const allPosts = isYou ? (cloudContent.data ?? []).filter(r => r.user_id === account.user?.id && ["post", "reel", "tweet"].includes(r.kind)).map(r => asExploreItem(r, true, account.profile?.full_name || "You")) : posts;
  const grid = tab === "posts" ? allPosts.filter((p) => p.kind !== "reel") : tab === "reels" ? allPosts.filter((p) => p.kind === "reel") : isYou ? savedItems : [];
  const tabs: { id: Tab; label: string; Icon: typeof Grid3x3 }[] = [
    { id: "posts", label: "Posts", Icon: Grid3x3 },
    { id: "reels", label: "Reels", Icon: Clapperboard },
    ...(isYou ? [{ id: "saved" as Tab, label: "Saved", Icon: Bookmark }] : []),
  ];

  const itemCls = "min-h-11 sm:min-h-9";
  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Profile options" className={cn("grid h-9 w-9 place-items-center rounded-full hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", !desktop && "-mr-2")}>
        <MoreVertical className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={8} className="w-48">
        {isYou ? (
          <>
            <DropdownMenuItem asChild>
              <Link to="/account/tickets"><Ticket className="h-4 w-4" /> Tickets</Link>
            </DropdownMenuItem>
            {!desktop && <DropdownMenuItem onSelect={() => setCreate(true)}><Plus className="h-4 w-4" /> Create</DropdownMenuItem>}
            <DropdownMenuItem onSelect={() => void shareProfile(profile.id)}><Share2 className="h-4 w-4" /> Share profile</DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem className={itemCls} onSelect={() => void copyProfileLink(profile.id)}><Link2 className="h-4 w-4" /> Copy profile link</DropdownMenuItem>
            <DropdownMenuItem className={itemCls} onSelect={() => { setMod({ ...mod, restricted: toggleIn(mod.restricted, profile.id) }); toast(restricted ? `Unrestricted ${view.username}` : `Restricted ${view.username}`); }}>
              <ShieldOff className="h-4 w-4" /> {restricted ? "Unrestrict" : "Restrict"}
            </DropdownMenuItem>
            <DropdownMenuItem className={itemCls} onSelect={() => { if (blocked) { setMod({ ...mod, blocked: toggleIn(mod.blocked, profile.id) }); toast(`Unblocked ${view.username}`); } else setBlockOpen(true); }}>
              <Ban className="h-4 w-4" /> {blocked ? "Unblock" : "Block"}
            </DropdownMenuItem>
            <DropdownMenuItem className={cn(itemCls, "text-primary focus:text-primary")} onSelect={() => setReportOpen(true)}><Flag className="h-4 w-4" /> Report</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const statusChip = !isYou && (restricted || blocked) ? (
    <span className="mt-1 inline-block rounded bg-ink-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">{blocked ? "Blocked" : "Restricted"}</span>
  ) : null;


  return (
    <div className={desktop ? "mx-auto hidden max-w-[600px] px-6 sm:block" : "sm:hidden"}>
      <section className="relative px-4 pb-2 pt-4 text-center">
        <div className="absolute right-1 top-1">{menu}</div>
        <button aria-label={hasActiveStory ? "View story" : "Profile picture"} onClick={() => hasActiveStory && setViewer(0)} className="mx-auto block">
          <Avatar self={isYou} name={view.fullName} size={96} ring={hasActiveStory ? (st.seenStories.includes(profile.id) ? "seen" : "unseen") : "none"} pad={3} />
        </button>
        <h1 className="mt-2.5 flex items-center justify-center gap-1.5 text-[17px] font-bold leading-tight">
          <span className="min-w-0 truncate">{isYou ? "Praneeth" : `@${view.username}`}</span>
          <BadgesFor handle={profile.id} />
        </h1>
        <div className="mt-3 flex items-start justify-center gap-7">
          <Stat n={abbr(followingCount)} label="connection" onClick={() => onList("following")} />
          <Stat n={abbr(followerCount)} label="connect" onClick={() => onList("followers")} />
          <Stat n={posts.length} label="connected" />
          <Stat n={posts.length} label="post" />
        </div>
        <p className="mt-3 text-[14px] font-semibold leading-tight">{view.fullName}</p>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">{isYou ? "SAC member" : profile.type}</p>
        {statusChip}
        {view.bio && <p className="mx-auto mt-1.5 line-clamp-3 max-w-[34ch] text-[12.5px] leading-snug text-ink-foreground/80">{view.bio}</p>}
        {view.location && <p className="mt-1 text-[12px] text-ink-muted">{view.location}</p>}
        {isYou && (
          <div className="mx-auto mt-2 grid w-full max-w-[320px] grid-cols-2 gap-2">
            <button onClick={() => setCreate(true)} className="flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary text-[12px] font-bold text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Create
            </button>
            <button onClick={() => openAccountEditProfile()} className="h-10 rounded-md bg-ink-soft text-[12px] font-bold hover:opacity-80">Edit profile</button>
          </div>
        )}
      </section>
      {!isYou && <ProfileDetails profile={profile} desktop={desktop} />}

      {(isYou || (hasActiveStory && !blocked)) && <ul aria-label="Stories" className={cn("flex gap-4 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none]", desktop ? "mt-6 px-0" : "mt-4 px-4")}>
        {isYou ? (
          <li className={cn("shrink-0 text-center", desktop ? "w-20" : "w-[68px]")}>
            <button onClick={() => (hasActiveStory ? setViewer(0) : setCreate(true))} className="relative mx-auto block" aria-label="Your story">
              <Avatar self={isYou} name={view.fullName} size={desktop ? 72 : 62} ring={hasActiveStory ? (st.seenStories.includes(profile.id) ? "seen" : "unseen") : "none"} pad={2} />
              {!hasActiveStory && (
                <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-ink bg-primary text-primary-foreground">
                  <Plus className="h-3 w-3" />
                </span>
              )}
            </button>
            <span className="mt-1.5 block truncate text-[11.5px] text-ink-foreground">Your story</span>
          </li>
        ) : hasActiveStory ? (
          <li className={cn("shrink-0 text-center", desktop ? "w-20" : "w-[68px]")}>
            <button onClick={() => setViewer(0)} aria-label={`${view.username}'s story`} className="mx-auto block">
              <Avatar self={isYou} name={view.fullName} size={desktop ? 72 : 62} ring={st.seenStories.includes(profile.id) ? "seen" : "unseen"} pad={2} />
            </button>
            <span className="mt-1.5 block truncate text-[11.5px] text-ink-foreground">{view.username}</span>
          </li>
        ) : null}
      </ul>}

      <div role="tablist" aria-label="Profile content" className={cn("grid border-t border-ink-border", desktop ? "mt-6" : "mt-4")} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} aria-label={label} onClick={() => setTab(id)} className={cn("relative grid h-11 place-items-center", tab === id ? "text-ink-foreground" : "text-ink-muted")}>
            <Icon className="h-5 w-5" />
            <span className={cn("absolute inset-x-0 bottom-0 h-0.5 bg-ink-foreground transition-transform origin-center", tab === id ? "scale-x-100" : "scale-x-0")} />
          </button>
        ))}
      </div>

      {blocked ? (
        <div className="py-14 text-center">
          <p className="text-[14px] text-ink-muted">You blocked this account.</p>
          <button onClick={() => { setMod({ ...mod, blocked: toggleIn(mod.blocked, profile.id) }); toast(`Unblocked ${view.username}`); }} className="mt-3 h-9 rounded-lg bg-ink-soft px-5 text-[13px] font-semibold hover:opacity-80">Unblock</button>
        </div>
      ) : grid.length === 0 ? (
        <ProfileEmptyState
          tab={tab}
          isYou={isYou}
          onCreate={() => setCreate(true)}
        />
      ) : (
        <ul className="grid grid-cols-3 gap-0.5">
          {grid.map((i) => (
            <li key={i.id} className={cn("relative overflow-hidden bg-ink-soft", tab === "reels" ? "aspect-[9/16]" : "aspect-square")}>
              <Link to="/explore" search={i.kind === "reel" ? { reel: i.id, from: profile.id } : { post: i.id, from: profile.id }} aria-label={i.kind === "reel" ? "Open reel" : "Open post"} className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                {(i.images?.[0] ?? i.img) ? (
                  <img src={i.images?.[0] ?? i.img} alt={i.caption} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-ink-muted"><Clapperboard className="h-8 w-8" /></span>
                )}
                {i.kind === "reel" ? <Clapperboard aria-label="Reel" className="absolute right-1.5 top-1.5 h-4 w-4 text-white drop-shadow" /> : i.images && <Images aria-label="Carousel" className="absolute right-1.5 top-1.5 h-4 w-4 text-white drop-shadow" />}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!isYou && (
        <>
          <BlockDialog open={blockOpen} onOpenChange={setBlockOpen} name={view.username} onConfirm={() => { setMod({ ...mod, blocked: toggleIn(mod.blocked, profile.id) }); setBlockOpen(false); toast(`Blocked ${view.username}`); }} />
          <ReportDialog open={reportOpen} onOpenChange={setReportOpen} name={view.username} />
        </>
      )}
      {viewer !== null && !blocked && profileStories.length > 0 && <StoryViewer entries={profileStories} start={viewer} onClose={() => setViewer(null)} />}

      <CreateContent open={create} onClose={() => setCreate(false)} />

    </div>
  );
}

async function shareProfile(id: string) {
  const url = `${window.location.origin}/u/${id}`;
  try {
    if (navigator.share) await navigator.share({ url });
    else {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    }
  } catch {
    /* cancelled */
  }
}

async function copyProfileLink(id: string) {
  const url = `${window.location.origin}/u/${encodeURIComponent(id)}`;
  try {
    if (!navigator.clipboard?.writeText) throw new Error("unavailable");
    await navigator.clipboard.writeText(url);
    toast("Profile link copied");
  } catch {
    toast("Couldn't copy the link — clipboard access isn't available");
  }
}

// Temporary, in-memory moderation state (resets on refresh).
type ModState = { restricted: string[]; blocked: string[] };
let modState: ModState = { restricted: [], blocked: [] };
const modListeners = new Set<() => void>();
function setMod(next: ModState) {
  modState = next;
  modListeners.forEach((l) => l());
}
function toggleIn(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}
function useMod() {
  return useSyncExternalStore(
    (l) => {
      modListeners.add(l);
      return () => modListeners.delete(l);
    },
    () => modState,
    () => modState,
  );
}

const REPORT_REASONS = ["Spam", "Harassment", "Impersonation", "Inappropriate content", "Other"] as const;

function BlockDialog({ open, onOpenChange, name, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; name: string; onConfirm: () => void }) {
  return (
    <ResponsiveOverlay open={open} onOpenChange={onOpenChange} title={`Block ${name}?`}>
      <div className="p-5 text-center">
        <h2 className="text-[16px] font-semibold">Block {name}?</h2>
        <p className="mt-2 text-[13px] text-ink-muted">Their posts, reels and stories will be hidden on this profile. You can unblock them at any time from here.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="h-11 rounded-lg bg-ink-soft text-[13px] font-semibold hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Cancel</button>
          <button type="button" onClick={onConfirm} className="h-11 rounded-lg bg-primary text-[13px] font-bold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-foreground">Block</button>
        </div>
      </div>
    </ResponsiveOverlay>
  );
}

function ReportDialog({ open, onOpenChange, name }: { open: boolean; onOpenChange: (o: boolean) => void; name: string }) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState(false);
  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setReason("");
      setDetails("");
      setError(false);
    }
  };
  return (
    <ResponsiveOverlay open={open} onOpenChange={close} title={`Report ${name}`}>
      <form
        className="overflow-y-auto p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!reason) return setError(true);
          close(false);
          toast("Thanks — your report has been noted");
        }}
      >
        <h2 className="text-center text-[16px] font-semibold">Report {name}</h2>
        <p className="mt-1 text-center text-[13px] text-ink-muted">Why are you reporting this account?</p>
        <fieldset className="mt-4 space-y-1">
          <legend className="sr-only">Reason</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-[14px] hover:bg-ink-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary", reason === r && "bg-ink-soft")}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => { setReason(r); setError(false); }} className="h-4 w-4 accent-[var(--color-primary)]" />
              {r}
            </label>
          ))}
        </fieldset>
        {error && <p role="alert" className="mt-2 text-[12px] text-primary">Please select a reason.</p>}
        <label className="mt-3 block text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Description (optional)
          <Textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} placeholder="Add any details" className="mt-1.5 min-h-20 text-[14px] font-normal normal-case tracking-normal" />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => close(false)} className="h-11 rounded-lg bg-ink-soft text-[13px] font-semibold hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Cancel</button>
          <button type="submit" className="h-11 rounded-lg bg-primary text-[13px] font-bold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-foreground">Submit</button>
        </div>
      </form>
    </ResponsiveOverlay>
  );
}
