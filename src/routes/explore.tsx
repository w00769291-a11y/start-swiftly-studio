import { CreateContent } from "@/components/account/CreateContent";
import { UploadedEvents } from "@/components/account/UploadedEvents";
import { useAccount, signOutAccount } from "@/lib/account";
import { useCommunityContent, asExploreItem } from "@/lib/community-content";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Bookmark, Clapperboard, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Heart, Home, MessageCircle, MoreHorizontal, Plus, Repeat2, Search, Send, Volume2, VolumeX } from "lucide-react";
import "@/components/explore/explore.css";
import { BadgesFor } from "@/components/explore/CategoryBadges";
import { ExploreSearch } from "@/components/explore/ExploreSearch";
import { Avatar, Caption, CommentInput, CommentList, ResponsiveOverlay, repostCount, shareCount, shareItem, useMq } from "@/components/explore/shared";
import { ReelViewer, StoryViewer } from "@/components/explore/Viewers";
import { YOU, exploreCatalog, exploreProfiles, type ExploreItem, type ExploreProfile } from "@/lib/explore-data";
import { abbr, ago, allComments, getFeed, getStories, getSuggestedProfiles, isFollowing, markItemsSeen, newSeed, setLiked, toast, toggleFollow, toggleLike, toggleRepost, useExploreState, type FeedEntry, type StoryEntry } from "@/lib/explore-service";
import { toggleSaved, useSaved } from "@/lib/saved";
import { cn } from "@/lib/utils";
import { addMyItem, addMyStory, readFileAsDataUrl, useMyContent } from "@/lib/my-content";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — SAC Community" },
      { name: "description", content: "Discover reels, posts and event moments from across the SAC Community — sports, arts, gaming, festivals and more." },
      { property: "og:title", content: "Explore — SAC Community" },
      { property: "og:description", content: "Reels, posts and event culture from across India's SAC Community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { reel?: string | undefined; post?: string | undefined; from?: string | undefined } => ({
    from: typeof search["from"] === "string" && search["from"] ? search["from"] : undefined,
    reel: typeof search["reel"] === "string" && search["reel"] ? search["reel"] : undefined,
    post: typeof search["post"] === "string" && search["post"] ? search["post"] : undefined,
  }),
  component: ExplorePage,
});

const TEXT_BG = [
  "from-[oklch(0.45_0.2_27)] to-[oklch(0.15_0.05_27)]",
  "from-[oklch(0.45_0.15_255)] to-[oklch(0.14_0.04_255)]",
  "from-[oklch(0.45_0.17_310)] to-[oklch(0.14_0.04_310)]",
  "from-[oklch(0.5_0.12_165)] to-[oklch(0.14_0.03_165)]",
];

/* ------------------------------------------------------------------------ page ---- */

function ExplorePage() {
  const md = useMq("(min-width: 768px)");
  const account = useAccount();
  const content = useCommunityContent();
  const queryClient = useQueryClient();
  const [eventsOpen, setEventsOpen] = useState(false);
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [baseStories, setStories] = useState<StoryEntry[] | null>(null);
  const mine = useMyContent();
  const stories = useMemo<StoryEntry[] | null>(() => {
    if (baseStories === null) return null;
    const now = Date.now();
    const my = mine.stories.filter((x) => x.expiresAt > now);
    return my.length ? [{ profile: YOU, story: { ...my[0]!, media: my.flatMap((x) => x.media) } }, ...baseStories] : baseStories;
  }, [baseStories, mine.stories]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [suggested, setSuggested] = useState<ExploreProfile[]>([]);
  const [storyAt, setStoryAt] = useState<number | null>(null);
  const [reelId, setReelId] = useState<string | null>(null);
  const xl = useMq("(min-width: 1280px)");
  const [railPref, setRailPref] = useState(false);
  const railCollapsed = !xl || railPref;
  const [commentItem, setCommentItem] = useState<ExploreItem | null>(null);
  const [postItem, setPostItem] = useState<ExploreItem | null>(null);
  const [menuItem, setMenuItem] = useState<ExploreItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ n: number; text: string } | null>(null);
  const [headerH, setHeaderH] = useState(56);
  const st = useExploreState();
  const busy = useRef(false);
  const cursor = useRef(0);
  const seed = useRef(newSeed());
  const sentinel = useRef<HTMLDivElement>(null);

  const load = useCallback(async (reset = false) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(false);
    try {
      if (reset) {
        cursor.current = 0;
        seed.current = newSeed();
        setEntries([]);
      }
      const r = await getFeed({ cursor: cursor.current, seed: seed.current, limit: 10 });
      cursor.current = r.nextCursor;
      setEntries((e) => (reset ? r.items : [...e, ...r.items]));
      markItemsSeen(r.items.map((x) => x.item.id));
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    void load(true);
    void getStories().then(setStories);
  }, [load]);

  useEffect(() => {
    void load();
    void getStories().then(setStories);
    void getSuggestedProfiles(5).then(setSuggested);
  }, [load]);

  // Open the exact reel or post named in the URL (from profile grids, shared links, refreshes).
  const { reel: reelParam, post: postParam, from: fromProfile } = Route.useSearch();
  const router = useRouter();
  // Leaving opened content: return to the originating profile when there is one, otherwise stay on Explore.
  const leaveContent = useCallback(() => {
    if (fromProfile) {
      if (router.history.canGoBack()) router.history.back();
      else void router.navigate({ to: "/u/$handle", params: { handle: fromProfile }, replace: true });
      return;
    }
    window.history.replaceState(window.history.state, "", "/explore");
  }, [fromProfile, router]);
  useEffect(() => {
    if (reelParam) {
      if (exploreCatalog.some((i) => i.id === reelParam && i.kind === "reel")) setReelId(reelParam);
      else setTimeout(() => toast("This reel isn't available"), 0);
    }
    if (postParam) {
      const item = exploreCatalog.find((i) => i.id === postParam && i.kind !== "reel");
      if (item) setPostItem(item);
      else setTimeout(() => toast("This post isn't available"), 0);
    }
  }, [reelParam, postParam]);

  // Rail: expanded by default at 1280px+, remembered; always collapsed from 768 to 1279px.
  useEffect(() => {
    try { setRailPref(window.localStorage.getItem(RAIL_KEY) === "1"); } catch { /* storage unavailable */ }
  }, []);
  const toggleRail = useCallback(() => {
    setRailPref((c) => {
      try { window.localStorage.setItem(RAIL_KEY, c ? "0" : "1"); } catch { /* storage unavailable */ }
      return !c;
    });
  }, []);

  // Infinite scroll: the next batch loads about two screens before the end.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && void load(), { rootMargin: "0px 0px 200% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [entries.length, load]);

  // Clicking the Explore nav item while already here scrolls to top and refreshes.
  useEffect(() => {
    const click = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest("a");
      if (a && a.getAttribute("href") === "/explore") {
        e.preventDefault();
        refresh();
      }
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [refresh]);

  // Pull to refresh (touch devices)
  useEffect(() => {
    let y0 = 0;
    let armed = false;
    const start = (e: TouchEvent) => {
      armed = window.scrollY <= 0;
      y0 = e.touches[0]?.clientY ?? 0;
    };
    const end = (e: TouchEvent) => {
      if (armed && (e.changedTouches[0]?.clientY ?? 0) - y0 > 100) refresh();
      armed = false;
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchend", end);
    };
  }, [refresh]);

  useEffect(() => {
    const t = (e: Event) => setToastMsg({ n: Date.now(), text: String((e as CustomEvent).detail) });
    window.addEventListener("explore-toast", t);
    return () => window.removeEventListener("explore-toast", t);
  }, []);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Read the real site header height into --explore-header-h (tablet and up; the header is hidden on mobile here).
  useEffect(() => {
    const h = document.querySelector("header");
    if (md && h) setHeaderH(Math.round(h.getBoundingClientRect().height) || 56);
  }, [md]);

  const onVisible = useCallback((key: string, vis: boolean) => setPlaying((p) => (vis ? key : p === key ? null : p)), []);
  const closeReel = useCallback(() => {
    setReelId(null);
    leaveContent();
  }, [leaveContent]);
  const syncReel = useCallback((id: string) => window.history.replaceState(window.history.state, "", `/explore?reel=${id}${fromProfile ? `&from=${encodeURIComponent(fromProfile)}` : ""}`), [fromProfile]);

  const uploaded = (content.data ?? []).filter(r => ["post", "reel", "tweet"].includes(r.kind)).map(r => asExploreItem(r, r.user_id === account.user?.id, account.profile?.full_name || "Community"));
  uploaded.forEach(item => { const index = exploreCatalog.findIndex(i => i.id === item.id); if (index < 0) exploreCatalog.unshift(item); else exploreCatalog[index] = item; });
  const visible = [...uploaded.map(item => ({ item, key: `uploaded-${item.id}` })), ...entries.filter(e => !uploaded.some(i => i.id === e.item.id))].filter((e) => !hidden.includes(e.item.id));
  const reels = useMemo(() => {
    const ids = [...new Set(entries.filter((e) => e.item.kind === "reel").map((e) => e.item.id))];
    const rest = exploreCatalog.filter((i) => i.kind === "reel" && !ids.includes(i.id)).map((i) => i.id);
    return [...ids, ...rest].map((id) => exploreCatalog.find((i) => i.id === id)).filter((i): i is ExploreItem => !!i);
  }, [entries]);
  const storyState = (handle: string): "unseen" | "seen" | "none" => (stories?.some((s) => s.profile.id === handle) ? (st.seenStories.includes(handle) ? "seen" : "unseen") : "none");
  const openStory = (handle: string) => {
    const i = stories?.findIndex((s) => s.profile.id === handle) ?? -1;
    if (i >= 0) setStoryAt(i);
  };

  return (
    <div
      className="explore-root bg-ink pb-[env(safe-area-inset-bottom)] pt-[calc(3.5rem+var(--explore-nav-h)+env(safe-area-inset-top))] text-[14px] text-ink-foreground md:pb-0 md:pt-0"
      style={{ ["--explore-header-h" as string]: `${headerH}px`, ["--explore-rail-w" as string]: railCollapsed ? "72px" : "220px" }}
    >
      {/* Explore-only mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b border-ink-border bg-ink px-2 pt-[env(safe-area-inset-top)] md:hidden">
        <Link to="/" aria-label="←" className="grid h-11 w-11 place-items-center">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <span className="min-w-0 font-display text-lg">
          SAC <span className="text-primary">COMMUNITY</span>
        </span>
        <div className="flex shrink-0 items-center">
        <Button variant="ghost" size="icon" onClick={() => setEventsOpen(true)} aria-label="Events" title="Events"><CalendarDays /></Button>
        <button onClick={() => toast("No new notifications")} aria-label="Notifications" className="relative grid h-11 w-11 place-items-center">
          <Heart className="h-6 w-6" />
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-primary" />
        </button>
        </div>
      </div>

      <div className="explore-grid pt-0 md:px-4 md:pt-[calc(var(--explore-header-h)+24px)]">
        <div className="min-w-0">
          {/* Stories row (tablet / small laptop; moves to the right column from 1200px) */}
          <div className="no-scrollbar hidden snap-x gap-2.5 md:flex overflow-x-auto py-2 pl-3 pr-3 touch-pan-x md:gap-4 md:pb-3 md:pl-0 md:pr-0 md:pt-0 min-[1200px]:!hidden" aria-label="Stories">
            <button onClick={() => setGalleryOpen(true)} className="w-[60px] shrink-0 snap-start text-center md:w-[66px]">
              <span className="relative mx-auto block w-fit">
                <Avatar name="you" size={md ? 66 : 56} pad={3} />
                <span className="absolute bottom-0 right-0 grid h-4 w-4 place-items-center rounded-full border-2 border-ink bg-primary text-primary-foreground md:h-5 md:w-5">
                  <Plus className="h-2.5 w-2.5 md:h-3 md:w-3" />
                </span>
              </span>
              <span className="mt-1 block truncate text-[11px] md:text-[12px]">Your pics</span>
            </button>
            {stories === null
              ? [0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-[60px] shrink-0 md:w-[66px]">
                    <span className="mx-auto block h-14 w-14 animate-pulse rounded-full bg-ink-soft md:h-[66px] md:w-[66px]" />
                    <span className="mx-auto mt-2 block h-2.5 w-12 animate-pulse rounded bg-ink-soft" />
                  </span>
                ))
              : stories.map((s, i) => (
                  <button key={s.story.id} onClick={() => setStoryAt(i)} className="w-[60px] shrink-0 snap-start text-center md:w-[66px]" aria-label={`View ${s.profile.username}'s story`}>
                    <Avatar name={s.profile.fullName} size={md ? 66 : 56} pad={3} ring={st.seenStories.includes(s.profile.id) ? "seen" : "unseen"} />
                    <span className="mt-1 block truncate text-[11px] md:text-[12px]">{s.profile.username}</span>
                  </button>
                ))}
          </div>

          <div className="flex items-center justify-between gap-3 px-3 py-3 md:px-0">
            <Button variant="ghost" className="max-md:hidden" onClick={() => setEventsOpen(true)}><CalendarDays /> Events</Button>
            {account.user ? <><Link to="/u/$handle" params={{ handle: "you" }} className="min-w-0 truncate text-sm">{account.profile?.full_name || "My profile"}</Link><Button variant="ghost" size="sm" onClick={async () => { await signOutAccount(queryClient); await router.navigate({to:"/login",replace:true}); }}>Log out</Button></> : <Button asChild size="sm"><Link to="/login">Log in</Link></Button>}
          </div>
          {/* Unified feed */}
          <div className="border-t border-ink-border md:border-t-0">
            {visible.map((e) => (
              <PostCard
                key={e.key}
                entry={e}
                playing={playing === e.key}
                muted={muted}
                onMute={() => setMuted((m) => !m)}
                onVisible={onVisible}
                onComment={setCommentItem}
                onMenu={setMenuItem}
                onOpenReel={(id) => setReelId(id)}
                storyState={storyState(e.item.handle)}
                onStory={() => openStory(e.item.handle)}
              />
            ))}
            {loading && [0, 1].map((i) => <CardSkeleton key={i} />)}
            {error && !loading && (
              <div className="py-10 text-center">
                <p className="text-ink-muted">Couldn't load more posts.</p>
                <button onClick={() => void load()} className="mt-3 h-11 rounded-lg bg-primary px-5 font-semibold text-primary-foreground">
                  Retry
                </button>
              </div>
            )}
            <div ref={sentinel} aria-hidden className="h-px" />
          </div>
        </div>

        <RightColumn suggested={suggested} stories={stories} seen={st.seenStories} onAdd={() => setGalleryOpen(true)} onOpen={setStoryAt} />
      </div>

      {/* Same nav: horizontal bar on mobile, fixed collapsible rail on the left from tablet up. */}
      <nav aria-label="Explore" className="explore-rail fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-40 flex h-[var(--explore-nav-h)] items-center justify-around border-b border-ink-border bg-ink md:bottom-0 md:right-auto md:top-[var(--explore-header-h)] md:h-auto md:flex-col md:items-stretch md:justify-start md:gap-2 md:border-b-0 md:border-r md:px-0 md:pb-4 md:pt-6">
        <RailItem label="Create" collapsed={railCollapsed} onClick={() => setGalleryOpen(true)} icon={<span className="explore-add-circle grid h-9 w-9 place-items-center rounded-full"><Plus className="h-4 w-4" /></span>} />
        <RailItem label="Home" collapsed={railCollapsed} onClick={refresh} icon={<Home className="h-7 w-7" />} />
        <RailItem label="Reels" collapsed={railCollapsed} onClick={() => setReelId(reels[0]?.id ?? null)} icon={<Clapperboard className="h-7 w-7" />} />
        <RailItem label="Search" collapsed={railCollapsed} onClick={() => setSearchOpen(true)} icon={<Search className="h-7 w-7" />} />
        <RailItem label="Profile" collapsed={railCollapsed} to="profile" icon={<Avatar name="you" size={28} />} />
        {xl && (
          <button
            onClick={toggleRail}
            aria-expanded={!railCollapsed}
            aria-label={railCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="explore-rail-item relative mt-auto hidden h-12 w-full items-center gap-4 rounded-lg px-[18px] text-ink-muted hover:bg-ink-soft/60 hover:text-ink-foreground md:flex"
          >
            <span className="grid w-9 shrink-0 place-items-center">{railCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}</span>
            {!railCollapsed && <span className="whitespace-nowrap text-[14px] font-semibold">Collapse</span>}
          </button>
        )}
      </nav>

      {!md && stories && stories.length > 0 && storyAt === null && <StoryRail stories={stories} seen={st.seenStories} onOpen={setStoryAt} />}

      {searchOpen && <ExploreSearch fullscreen onClose={() => setSearchOpen(false)} />}
      <CreateContent open={galleryOpen} onClose={() => setGalleryOpen(false)} />
      <UploadedEvents open={eventsOpen} onClose={() => setEventsOpen(false)} />
      {storyAt !== null && stories && <StoryViewer entries={stories} start={storyAt} onClose={() => setStoryAt(null)} />}
      {reelId && reels.length > 0 && <ReelViewer reels={reels} startId={reelId} onClose={closeReel} onChange={syncReel} onMenu={setMenuItem} />}
      <PostViewModal item={postItem} onClose={() => { setPostItem(null); if (postParam) leaveContent(); }} onComment={setCommentItem} onMenu={setMenuItem} onOpenReel={setReelId} />
      <PostModal item={commentItem} onClose={() => { setCommentItem(null); if (postParam && !postItem) leaveContent(); }} onMenu={setMenuItem} />
      <MenuSheet item={menuItem} onClose={() => setMenuItem(null)} onHide={(id) => setHidden((h) => [...h, id])} />

      {toastMsg && (
        <div key={toastMsg.n} role="status" className="explore-toast fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] left-1/2 z-[95] max-w-[90vw] rounded-lg bg-white px-4 py-2.5 text-[14px] font-semibold text-black shadow-xl md:bottom-6">
          {toastMsg.text}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- post card ---- */
function CardSkeleton() {
  return (
    <div className="mb-4 border-b border-ink-border pb-4" aria-hidden>
      <div className="flex items-center gap-3 px-3 py-3 md:px-0">
        <span className="h-9 w-9 animate-pulse rounded-full bg-ink-soft" />
        <span className="h-3 w-32 animate-pulse rounded bg-ink-soft" />
      </div>
      <div className="aspect-[4/5] w-full animate-pulse bg-ink-soft md:rounded-sm" />
    </div>
  );
}

type CardProps = {
  entry: FeedEntry;
  playing: boolean;
  muted: boolean;
  onMute: () => void;
  onVisible: (key: string, v: boolean) => void;
  onComment: (i: ExploreItem) => void;
  onMenu: (i: ExploreItem) => void;
  onOpenReel: (id: string) => void;
  storyState: "unseen" | "seen" | "none";
  onStory: () => void;
};

function PostCard({ entry, playing, muted, onMute, onVisible, onComment, onMenu, onOpenReel, storyState, onStory }: CardProps) {
  const { item, key } = entry;
  const st = useExploreState();
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slides = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  const [near, setNear] = useState(false);
  const [paused, setPaused] = useState(false);
  const [burst, setBurst] = useState(0);
  const [slide, setSlide] = useState(0);
  const isReel = item.kind === "reel";
  const images = item.images && item.images.length > 1 ? item.images : null;
  const following = isFollowing(st, item.handle);
  const ratio = item.text || images || isReel || Number(item.id.slice(1)) % 2 === 1 ? "aspect-[4/5]" : "aspect-square";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nearIo = new IntersectionObserver((e) => setNear(!!e[0]?.isIntersecting), { rootMargin: "100% 0px" });
    nearIo.observe(el);
    let playIo: IntersectionObserver | null = null;
    if (item.video) {
      playIo = new IntersectionObserver((e) => onVisible(key, !!e[0]?.isIntersecting && e[0].intersectionRatio >= 0.6), { threshold: [0, 0.6] });
      playIo.observe(el);
    }
    return () => {
      nearIo.disconnect();
      playIo?.disconnect();
      onVisible(key, false);
    };
  }, [item.video, key, onVisible]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (playing && !paused) v.play().catch(() => {});
    else v.pause();
  }, [playing, paused, muted, near]);

  const mediaClick = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      void setLiked(item.id, true);
      setBurst((b) => b + 1);
    } else if (item.video) setPaused((p) => !p);
    lastTap.current = now;
  };
  const scrollSlides = (d: number) => slides.current?.scrollBy({ left: d * slides.current.clientWidth, behavior: "smooth" });
  const subtitle = isReel ? (item.audio ? `♫ ${item.audio}` : "Reel") : (item.location ?? item.tag);
  const likedBy = exploreProfiles.filter((p) => p.id !== item.handle);
  const n = Number(item.id.slice(1)) || 0;
  const l1 = likedBy[n % likedBy.length];
  const l2 = likedBy[(n + 3) % likedBy.length];
  const total = allComments(item, st).length;

  return (
    <article ref={ref} id={key} className="mb-4 border-b border-ink-border pb-4">
      <header className="flex items-center gap-3 px-3 py-2.5 md:px-0">
        <button onClick={onStory} disabled={storyState === "none"} aria-label={`${item.creator} story`} className="shrink-0">
          <Avatar name={item.creator} size={36} ring={storyState} pad={2} />
        </button>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="flex items-center gap-x-1.5 text-[14px] font-semibold">
            <Link to="/u/$handle" params={{ handle: item.handle }} className="min-w-0 truncate hover:opacity-80">{item.handle}</Link>
            <BadgesFor handle={item.handle} />
            {!following && (
              <>
                <span className="shrink-0 text-ink-muted">•</span>
                <button onClick={() => void toggleFollow(item.handle)} className="h-8 shrink-0 text-[14px] font-semibold text-primary">Follow</button>
              </>
            )}
          </p>
          <p className="truncate text-[12px] text-ink-muted">{subtitle}</p>
        </div>
        <button onClick={() => onMenu(item)} aria-label="More options" className="grid h-11 w-11 place-items-center">
          <MoreHorizontal className="h-6 w-6" />
        </button>
      </header>

      <div className={cn("group relative w-full select-none overflow-hidden bg-ink-soft md:rounded-sm", ratio)} onClick={mediaClick}>
        {item.text ? (
          <div className={cn("flex h-full w-full flex-col justify-end bg-gradient-to-br p-6 md:p-8", TEXT_BG[item.text.bg % TEXT_BG.length])}>
            <p className="font-display text-4xl leading-[0.95] text-white md:text-5xl">{item.text.headline}</p>
          </div>
        ) : images ? (
          <div
            ref={slides}
            className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto"
            onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth || 1)))}
          >
            {images.map((src, i) => (
              <img key={src + i} src={src} alt={`${item.caption} (${i + 1} of ${images.length})`} loading="lazy" draggable={false} className="h-full w-full shrink-0 snap-start object-cover" />
            ))}
          </div>
        ) : item.video && near ? (
          <video ref={videoRef} src={item.video} poster={item.img} loop playsInline muted preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <img src={item.img} alt={item.caption} loading="lazy" className="h-full w-full object-cover" />
        )}

        <span className="absolute left-3 top-3 bg-black/60 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">{item.tag}</span>
        {images && <span className="absolute right-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[12px] font-semibold text-white">{slide + 1}/{images.length}</span>}
        {isReel && !images && (
          <button onClick={(e) => { e.stopPropagation(); onOpenReel(item.id); }} aria-label="Open in Reels" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white">
            <Clapperboard className="h-5 w-5" />
          </button>
        )}
        {item.video && (
          <button onClick={(e) => { e.stopPropagation(); onMute(); }} aria-label={muted ? "Unmute" : "Mute"} aria-pressed={!muted} className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}
        {burst > 0 && <Heart key={burst} className="explore-burst pointer-events-none absolute left-1/2 top-1/2 -ml-12 -mt-12 h-24 w-24 fill-white text-white" />}
        {images && slide > 0 && (
          <button onClick={(e) => { e.stopPropagation(); scrollSlides(-1); }} aria-label="Previous image" className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black opacity-0 transition-opacity group-hover:opacity-100 md:grid">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {images && slide < images.length - 1 && (
          <button onClick={(e) => { e.stopPropagation(); scrollSlides(1); }} aria-label="Next image" className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black opacity-0 transition-opacity group-hover:opacity-100 md:grid">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {images && (
        <div className="mt-2 flex justify-center gap-1" aria-hidden>
          {images.map((_, i) => (
            <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === slide ? "bg-primary" : "bg-ink-border")} />
          ))}
        </div>
      )}

      {item.event && (
        <div className="mx-3 mt-3 flex items-center gap-3 border border-ink-border bg-ink-soft/50 p-3 md:mx-0">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{item.event.name}</p>
            <p className="truncate text-[13px] text-ink-muted">{item.event.date} · {item.event.city} · {item.event.price === 0 ? "Free" : `From ₹${item.event.price}`}</p>
          </div>
          <Link to="/event/$slug" params={{ slug: item.event.slug }} className="inline-flex h-11 shrink-0 items-center bg-primary px-4 text-[12px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
            {item.event.price === 0 ? "Register" : "Book"}
          </Link>
        </div>
      )}

      <div className="px-3 md:px-0">
        <ActionRow item={item} onComment={() => onComment(item)} />
        {l1 && l2 && (
          <p className="mt-1 flex items-center gap-2 text-[14px]">
            <span className="flex -space-x-1.5">
              <Avatar name={l1.fullName} size={20} />
              <Avatar name={l2.fullName} size={20} />
            </span>
            <span>Liked by <b className="font-semibold">{l1.username}</b> and others</span>
          </p>
        )}
        <Caption handle={item.handle} text={item.caption} className="mt-1.5" />
        {total > 0 && (
          <button onClick={() => onComment(item)} className="mt-1 text-[14px] text-ink-muted hover:text-ink-foreground">View all {total} comments</button>
        )}
        <p className="mt-1 text-[12px] text-ink-muted">{ago(item.ageH)}</p>
        <CommentInput itemId={item.id} className="mt-1 hidden border-t-0 px-0 py-0 md:flex" />
      </div>
    </article>
  );
}

function ActionRow({ item, onComment }: { item: ExploreItem; onComment: () => void }) {
  const st = useExploreState();
  const liked = st.liked.includes(item.id);
  const reposted = st.reposts.includes(item.id);
  const saved = useSaved().includes(`explore:${item.id}`);
  const btn = "flex h-11 min-w-11 items-center justify-center gap-1.5 pr-2 text-[14px] font-semibold hover:opacity-70";
  return (
    <div className="-ml-2.5 flex items-center">
      <button onClick={() => void toggleLike(item.id)} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} className={btn}>
        <Heart className={cn("h-6 w-6", liked && "explore-pop fill-primary text-primary")} />
        {abbr(item.likes + (liked ? 1 : 0))}
      </button>
      <button onClick={onComment} aria-label="Comments" className={btn}>
        <MessageCircle className="h-6 w-6" />
        {abbr(allComments(item, st).length)}
      </button>
      <button onClick={() => void toggleRepost(item.id)} aria-pressed={reposted} aria-label="Repost" className={btn}>
        <Repeat2 className={cn("h-6 w-6", reposted && "text-primary")} />
        {abbr(repostCount(item) + (reposted ? 1 : 0))}
      </button>
      <button onClick={() => void shareItem(item)} aria-label="Share" className={btn}>
        <Send className="h-6 w-6" />
        {abbr(shareCount(item))}
      </button>
      <button onClick={() => toggleSaved(`explore:${item.id}`)} aria-pressed={saved} aria-label={saved ? "Unsave" : "Save"} className="ml-auto grid h-11 w-11 place-items-center hover:opacity-70">
        <Bookmark className={cn("h-6 w-6", saved && "fill-current")} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- sidebar, sheets ---- */
function FollowBtn({ id }: { id: string }) {
  const st = useExploreState();
  const on = isFollowing(st, id);
  return (
    <button onClick={() => void toggleFollow(id)} className={cn("h-8 shrink-0 px-2 text-[13px] font-semibold", on ? "text-ink-muted" : "text-primary")}>
      {on ? "Following" : "Follow"}
    </button>
  );
}

const SUGGEST_COLLAPSED_KEY = "sac-explore-suggestions-collapsed";

function RightColumn({ suggested, stories, seen, onAdd, onOpen }: { suggested: ExploreProfile[]; stories: StoryEntry[] | null; seen: string[]; onAdd: () => void; onOpen: (i: number) => void }) {
  const [folded, setFolded] = useState(false);
  useEffect(() => {
    try { setFolded(window.localStorage.getItem(SUGGEST_COLLAPSED_KEY) === "1"); } catch { /* storage unavailable */ }
  }, []);
  const toggle = () => {
    setFolded((f) => {
      try { window.localStorage.setItem(SUGGEST_COLLAPSED_KEY, f ? "0" : "1"); } catch { /* storage unavailable */ }
      return !f;
    });
  };
  const row = "flex w-full min-w-0 items-center gap-3 rounded-md py-1.5 text-left hover:bg-ink-soft/60";
  return (
    <aside className="no-scrollbar sticky top-[calc(var(--explore-header-h)+24px)] hidden max-h-[calc(100dvh-var(--explore-header-h)-24px)] w-[300px] min-w-0 self-start overflow-y-auto pb-6 min-[1200px]:block">
      <h2 className="mb-2 text-[14px] font-semibold text-ink-muted">Pics</h2>
      <ul className="no-scrollbar max-h-[312px] overflow-y-auto" aria-label="Stories">
        <li>
          <button onClick={onAdd} className={row}>
            <span className="relative shrink-0">
              <Avatar name="you" size={40} pad={2} />
              <span className="absolute bottom-0 right-0 grid h-4 w-4 place-items-center rounded-full border-2 border-ink bg-primary text-primary-foreground">
                <Plus className="h-2.5 w-2.5" />
              </span>
            </span>
            <span className="min-w-0 truncate text-[14px] font-semibold">Your pics</span>
          </button>
        </li>
        {stories === null
          ? [0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3 py-1.5">
                <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-ink-soft" />
                <span className="h-3 w-28 animate-pulse rounded bg-ink-soft" />
              </li>
            ))
          : stories.map((s, i) => (
              <li key={s.story.id}>
                <button onClick={() => onOpen(i)} className={row} aria-label={`View ${s.profile.username}'s story`}>
                  <span className="shrink-0"><Avatar name={s.profile.fullName} size={40} pad={2} ring={seen.includes(s.profile.id) ? "seen" : "unseen"} /></span>
                  <span className="min-w-0 truncate text-[14px] font-semibold">{s.profile.username}</span>
                </button>
              </li>
            ))}
      </ul>

      <div className="mb-2 mt-6 flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-ink-muted">Suggested for you</h2>
        <button onClick={toggle} aria-expanded={!folded} aria-label={folded ? "Show suggestions" : "Hide suggestions"} className="grid h-8 w-8 shrink-0 place-items-center text-ink-muted transition-colors hover:text-ink-foreground">
          {folded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
      {!folded && (
        <ul>
          {suggested.map((p) => (
            <li key={p.id} className="flex min-w-0 items-center gap-3 py-1.5">
              <span className="shrink-0"><Avatar name={p.fullName} size={40} /></span>
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-center gap-1 text-[14px] font-semibold">
                  <Link to="/u/$handle" params={{ handle: p.id }} className="min-w-0 truncate hover:opacity-80">{p.username}</Link>
                  <BadgesFor handle={p.id} />
                </p>
                <p className="truncate text-[12px] text-ink-muted">{p.type} · {abbr(p.followers)} followers</p>
              </div>
              <FollowBtn id={p.id} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

const RAIL_KEY = "sac-explore-rail-collapsed";

function RailItem({ label, collapsed, icon, onClick, to }: { label: string; collapsed: boolean; icon: ReactNode; onClick?: () => void; to?: "profile" }) {
  const cls = "explore-rail-item relative grid h-12 w-12 place-items-center md:flex md:w-full md:items-center md:justify-start md:gap-4 md:rounded-lg md:px-[18px] md:hover:bg-ink-soft/60";
  const inner = (
    <>
      <span className="grid w-9 shrink-0 place-items-center">{icon}</span>
      <span className={cn("hidden whitespace-nowrap text-[15px] font-semibold", !collapsed && "md:inline")}>{label}</span>
      {collapsed && <span className="explore-tip hidden rounded-md bg-ink-soft px-2.5 py-1 text-[12px] font-semibold text-ink-foreground shadow-lg md:block">{label}</span>}
    </>
  );
  return to ? (
    <Link to="/u/$handle" params={{ handle: "you" }} aria-label={label} className={cls}>{inner}</Link>
  ) : (
    <button onClick={onClick} aria-label={label} className={cls}>{inner}</button>
  );
}

function MenuSheet({ item, onClose, onHide }: { item: ExploreItem | null; onClose: () => void; onHide: (id: string) => void }) {
  const navigate = useNavigate();
  if (!item) return null;
  const row = "flex h-12 w-full items-center justify-center border-t border-ink-border text-[14px] hover:bg-ink-soft";
  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };
  return (
    <ResponsiveOverlay open onOpenChange={(o) => !o && onClose()} title="Post options">
      <div className="flex flex-col">
        <button className={cn(row, "border-t-0 font-bold text-primary")} onClick={act(() => toast("Thanks. We'll review this listing."))}>Report incorrect information</button>
        <button className={row} onClick={act(() => { onHide(item.id); toast("We'll show fewer posts like this"); })}>Not interested</button>
        <button className={row} onClick={act(() => { void navigator.clipboard?.writeText(`${window.location.origin}/explore?reel=${item.id}`); toast("Link copied"); })}>Copy link</button>
        <button className={row} onClick={act(() => void navigate({ to: "/u/$handle", params: { handle: item.handle } }))}>Go to profile</button>
        <button className={row} onClick={onClose}>Cancel</button>
      </div>
    </ResponsiveOverlay>
  );
}

/* Normal post view: shows the post itself; comments open only via the comment button. */
function PostViewModal({ item, onClose, onComment, onMenu, onOpenReel }: { item: ExploreItem | null; onClose: () => void; onComment: (i: ExploreItem) => void; onMenu: (i: ExploreItem) => void; onOpenReel: (id: string) => void }) {
  const md = useMq("(min-width: 768px)");
  if (!item) return null;
  return (
    <ResponsiveOverlay open onOpenChange={(o) => !o && onClose()} title="Post" wide={md}>
      <div className={cn("min-h-0 flex-1 overflow-y-auto", md ? "mx-auto w-full max-w-[470px]" : "h-[85dvh]")}>
        <PostCard
          entry={{ item, key: `postview-${item.id}` }}
          playing={false}
          muted
          onMute={() => {}}
          onVisible={() => {}}
          onComment={onComment}
          onMenu={onMenu}
          onOpenReel={onOpenReel}
          storyState="none"
          onStory={() => {}}
        />
      </div>
    </ResponsiveOverlay>
  );
}

function PostModal({ item, onClose, onMenu }: { item: ExploreItem | null; onClose: () => void; onMenu: (i: ExploreItem) => void }) {
  const md = useMq("(min-width: 768px)");
  if (!item) return null;
  const cover = item.images?.[0] ?? item.img;
  return (
    <ResponsiveOverlay open onOpenChange={(o) => !o && onClose()} title="Comments" wide={md}>
      {md ? (
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,36dvh)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-1">
          <div className="relative min-h-0 bg-black">
            {item.text ? (
              <div className={cn("flex h-full items-end bg-gradient-to-br p-8", TEXT_BG[item.text.bg % TEXT_BG.length])}>
                <p className="font-display text-5xl leading-[0.95] text-white">{item.text.headline}</p>
              </div>
            ) : (
              <img src={cover} alt={item.caption} className="h-full w-full object-contain" />
            )}
          </div>
          <div className="flex min-h-0 flex-col border-t border-ink-border lg:border-l lg:border-t-0">
            <div className="flex items-center gap-3 border-b border-ink-border p-4 pr-12">
              <Avatar name={item.creator} size={36} />
              <p className="flex min-w-0 flex-1 items-center gap-1 text-[14px] font-semibold"><span className="min-w-0 truncate">{item.handle}</span><BadgesFor handle={item.handle} /></p>
              <button onClick={() => onMenu(item)} aria-label="More options" className="grid h-11 w-11 place-items-center"><MoreHorizontal className="h-6 w-6" /></button>
            </div>
            <div className="border-b border-ink-border px-4 py-3"><Caption handle={item.handle} text={item.caption} /></div>
            <CommentList item={item} />
            <div className="border-t border-ink-border px-4 pb-1 pt-2"><ActionRow item={item} onComment={() => {}} /><p className="text-[12px] text-ink-muted">{ago(item.ageH)}</p></div>
            <CommentInput itemId={item.id} />
          </div>
        </div>
      ) : (
        <div className="flex h-[70dvh] flex-col">
          <h2 className="border-b border-ink-border px-4 py-3 text-center text-[15px] font-semibold">Comments</h2>
          <CommentList item={item} />
          <CommentInput itemId={item.id} autoFocus={false} />
        </div>
      )}
    </ResponsiveOverlay>
  );
}

/* Mobile left-side story rail: one story at a time, swipe up/down to change */
function StoryRail({ stories, seen, onOpen }: { stories: StoryEntry[]; seen: string[]; onOpen: (i: number) => void }) {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const list = stories.slice(0, 6);
  const cur = list[active];
  const step = (d: number) => {
    if (list.length < 2) return;
    setDir(d);
    setActive((a) => (a + d + list.length) % list.length);
  };
  return (
    <div
      aria-label="Pics"
      className="fixed left-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-ink/70 p-1.5 backdrop-blur-md md:hidden"
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (!t) return;
        startY.current = t.clientY;
        startX.current = t.clientX;
      }}
      onTouchEnd={(e) => {
        const t = e.changedTouches[0];
        if (!t || startY.current == null || startX.current == null) return;
        const dy = t.clientY - startY.current;
        const dx = t.clientX - startX.current;
        if (Math.abs(dy) < 24 && Math.abs(dx) < 24) return;
        if (Math.abs(dy) >= Math.abs(dx)) step(dy < 0 ? 1 : -1);
        else step(dx < 0 ? 1 : -1);
        startY.current = null;
        startX.current = null;
      }}
    >
      {cur && (
        <button
          key={cur.story.id}
          onClick={() => onOpen(active)}
          aria-label={`View ${cur.profile.username}'s pics`}
          className={cn(
            "relative block",
            dir === 1 ? "animate-in fade-in slide-in-from-top-4 duration-300" : "animate-in fade-in slide-in-from-bottom-4 duration-300",
          )}
        >
          <Avatar name={cur.profile.fullName} size={48} pad={2} ring={seen.includes(cur.profile.id) ? "seen" : "unseen"} />
          <span className="absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-2xl bg-ink-soft px-3 py-1.5 text-[12px] font-semibold text-ink-foreground shadow-lg">
            {cur.profile.username}
          </span>
        </button>
      )}
    </div>
  );
}

