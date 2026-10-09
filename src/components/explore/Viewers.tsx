import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent as RPointerEvent } from "react";
import { ArrowLeft, Bookmark, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Heart, MessageCircle, MoreHorizontal, Play, Repeat2, Send, Volume2, VolumeX, X } from "lucide-react";
import type { ExploreItem } from "@/lib/explore-data";
import { abbr, allComments, isFollowing, markStorySeen, setLiked, toast, toggleFollow, toggleLike, toggleRepost, useExploreState, type StoryEntry } from "@/lib/explore-service";
import { toggleSaved, useSaved } from "@/lib/saved";
import { cn } from "@/lib/utils";
import { BadgesFor } from "./CategoryBadges";
import { Avatar, Caption, CommentInput, CommentList, ResponsiveOverlay, repostCount, shareCount, shareItem, useMq } from "./shared";

/* ------------------------------------------------------------------ Story viewer ---- */
const STORY_MS = 5000;

export function StoryViewer({ entries, start, onClose }: { entries: StoryEntry[]; start: number; onClose: () => void }) {
  const [u, setU] = useState(start);
  const [s, setS] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [msg, setMsg] = useState("");
  const entry = entries[u];
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const startY = useRef(0);

  const next = useCallback(() => {
    setProgress(0);
    setS((cur) => {
      if (cur + 1 < (entries[u]?.story.media.length ?? 0)) return cur + 1;
      if (u + 1 < entries.length) {
        setU(u + 1);
        return 0;
      }
      onClose();
      return cur;
    });
  }, [entries, u, onClose]);
  const prev = useCallback(() => {
    setProgress(0);
    if (s > 0) setS(s - 1);
    else if (u > 0) {
      setU(u - 1);
      setS(0);
    }
  }, [s, u]);

  useEffect(() => {
    if (entry) markStorySeen(entry.profile.id);
  }, [entry]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setProgress((p) => p + 50 / STORY_MS), 50);
    return () => clearInterval(t);
  }, [paused, u, s]);
  useEffect(() => {
    if (progress >= 1) next();
  }, [progress, next]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [next, prev, onClose]);

  const down = (e: RPointerEvent) => {
    held.current = false;
    startY.current = e.clientY;
    hold.current = setTimeout(() => {
      held.current = true;
      setPaused(true);
    }, 200);
  };
  const up = (e: RPointerEvent) => {
    if (hold.current) clearTimeout(hold.current);
    if (held.current) {
      setPaused(false);
      return;
    }
    if (e.clientY - startY.current > 90) return onClose();
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.33) prev();
    else next();
  };
  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setMsg("");
    toast("Message sent");
  };
  if (!entry) return null;
  const { profile, story } = entry;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/90" role="dialog" aria-modal="true" aria-label={`${profile.username}'s story`}>
      <button onClick={onClose} aria-label="Close story" className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center text-white md:right-6 md:top-6">
        <X className="h-7 w-7" />
      </button>
      {u > 0 && (
        <button onClick={prev} aria-label="Previous story" className="absolute left-6 z-20 hidden h-11 w-11 place-items-center rounded-full bg-white/15 text-white md:grid">
          <ChevronLeft />
        </button>
      )}
      {u < entries.length - 1 && (
        <button onClick={next} aria-label="Next story" className="absolute right-6 z-20 mt-0 hidden h-11 w-11 place-items-center rounded-full bg-white/15 text-white md:grid">
          <ChevronRight />
        </button>
      )}
      <div className="relative h-dvh w-full overflow-hidden bg-ink md:h-[calc(100dvh-32px)] md:w-auto md:max-w-full md:rounded-xl md:[aspect-ratio:9/16]">
        <img key={`${u}-${s}`} src={story.media[s]} alt={`Story by ${profile.fullName}`} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 touch-none" onPointerDown={down} onPointerUp={up} onPointerCancel={() => hold.current && clearTimeout(hold.current)} />
        <div className="pointer-events-none absolute inset-x-0 top-0 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex gap-1">
            {story.media.map((_, i) => (
              <span key={i} className="h-[3px] flex-1 overflow-hidden rounded bg-white/35">
                <span className="block h-full bg-white" style={{ width: `${i < s ? 100 : i === s ? Math.min(progress, 1) * 100 : 0}%` }} />
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5 pr-12 text-white">
            <Avatar name={profile.fullName} size={32} />
            <span className="min-w-0 truncate text-[14px] font-semibold leading-tight">{profile.username}</span>
            <BadgesFor handle={profile.id} />
            <span className="shrink-0 text-[13px] text-white/70">{Math.max(1, 24 - Math.round(story.expiresAt / 3600e3))}h</span>
          </div>
        </div>
        <form onSubmit={send} className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" onPointerDown={(e) => e.stopPropagation()}>
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            placeholder="Send message"
            aria-label="Send message"
            className="h-11 min-w-0 flex-1 rounded-full border border-white/50 bg-transparent px-4 text-[14px] text-white outline-none placeholder:text-white/70 focus:border-white"
          />
          <button type="submit" aria-label="Send" className="grid h-11 w-11 place-items-center text-white">
            <Send className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- Reel viewer ---- */
export function ReelViewer({ reels: reelsProp, startId, onClose, onChange, onMenu }: { reels: ExploreItem[]; startId: string; onClose: () => void; onChange?: (id: string) => void; onMenu: (item: ExploreItem) => void }) {
  // Freeze the list for this viewing session so the feed loading behind it can't swap the open reel.
  const [reels] = useState(reelsProp);
  const [idx, setIdx] = useState(Math.max(0, reels.findIndex((r) => r.id === startId)));
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [pct, setPct] = useState(0);
  const [burst, setBurst] = useState(0);
  const md = useMq("(min-width: 768px)");
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchY = useRef(0);
  const lastTap = useRef(0);
  const lastWheel = useRef(0);
  const item = reels[idx] ?? reels[0]!;
  const st = useExploreState();
  const liked = st.liked.includes(item.id);
  const reposted = st.reposts.includes(item.id);
  const saved = useSaved().includes(`explore:${item.id}`);
  const following = isFollowing(st, item.handle);

  const go = useCallback(
    (d: number) => {
      setIdx((i) => Math.min(reels.length - 1, Math.max(0, i + d)));
      setPaused(false);
      setPct(0);
    },
    [reels.length],
  );
  useEffect(() => onChange?.(item.id), [item.id, onChange]);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (paused) v.pause();
    else v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      v.play().catch(() => {});
    });
  }, [paused, muted, item.id]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === "escape") onClose();
      else if (key === "arrowdown" || key === "j") go(1);
      else if (key === "arrowup" || key === "k") go(-1);
      else if (key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (key === "m") setMuted((m) => !m);
      else if (key === "l") void toggleLike(item.id);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [go, onClose, item.id]);

  const tap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      void setLiked(item.id, true);
      setBurst((b) => b + 1);
    } else setPaused((p) => !p);
    lastTap.current = now;
  };

  const rail = (cls: string) => {
    const b = "flex flex-col items-center gap-1 text-[12px] font-semibold text-white md:text-ink-foreground";
    const icon = "h-6 w-6";
    return (
      <div className={cn("flex-col items-center gap-2 md:gap-5", cls)}>
        <button onClick={() => void toggleLike(item.id)} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} className={cn(b, "h-10 min-w-10 justify-center md:h-11 md:min-w-11")}>
          <Heart className={cn(icon, liked && "explore-pop fill-primary text-primary")} />
          {abbr(item.likes + (liked ? 1 : 0))}
        </button>
        <button onClick={() => setCommentsOpen((o) => !o)} aria-label="Comments" aria-pressed={commentsOpen} className={cn(b, "h-10 min-w-10 justify-center md:h-11 md:min-w-11")}>
          <MessageCircle className={icon} />
          {abbr(allComments(item, st).length)}
        </button>
        <button onClick={() => void toggleRepost(item.id)} aria-pressed={reposted} aria-label="Repost" className={cn(b, "h-10 min-w-10 justify-center md:h-11 md:min-w-11")}>
          <Repeat2 className={cn(icon, reposted && "text-primary")} />
          {abbr(repostCount(item) + (reposted ? 1 : 0))}
        </button>
        <button onClick={() => void shareItem(item)} aria-label="Share" className={cn(b, "h-10 min-w-10 justify-center md:h-11 md:min-w-11")}>
          <Send className={icon} />
          {abbr(shareCount(item))}
        </button>
        <button onClick={() => toggleSaved(`explore:${item.id}`)} aria-pressed={saved} aria-label={saved ? "Unsave" : "Save"} className={cn(b, "h-10 min-w-10 justify-center md:h-11 md:min-w-11")}>
          <Bookmark className={cn(icon, saved && "fill-current text-primary")} />
        </button>
        <button onClick={() => onMenu(item)} aria-label="More options" className={cn(b, "h-10 min-w-10 justify-center md:h-11 md:min-w-11")}>
          <MoreHorizontal className={icon} />
        </button>
      </div>
    );
  };

  const author = (
    <div className="flex items-center gap-2 md:gap-2.5">
      <span className="md:hidden"><Avatar name={item.creator} size={32} /></span>
      <span className="hidden md:block"><Avatar name={item.creator} size={40} /></span>
      <div className="min-w-0 flex-1 md:flex-none">
        <p className="flex items-center gap-1 text-[13px] font-semibold leading-tight md:text-[14px]">
          <span className="min-w-0 truncate">{item.handle}</span>
          <BadgesFor handle={item.handle} />
        </p>
        <p className="hidden truncate text-[13px] opacity-70 md:block">{item.creator}</p>
      </div>
      <button onClick={() => void toggleFollow(item.handle)} className={cn("ml-1 h-7 shrink-0 rounded-md px-2.5 text-[12px] font-semibold md:ml-2 md:h-8 md:rounded-lg md:px-3 md:text-[13px]", following ? "bg-white/20" : "bg-primary text-primary-foreground")}>
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[45] flex items-center justify-center overflow-auto bg-black text-ink-foreground md:top-[var(--explore-header-h)] md:bg-ink"
      role="dialog"
      aria-modal="true"
      aria-label="Reels"
      onWheel={(e) => {
        const now = Date.now();
        if (!md || now - lastWheel.current < 600 || Math.abs(e.deltaY) < 20) return;
        lastWheel.current = now;
        go(e.deltaY > 0 ? 1 : -1);
      }}
    >
      <button onClick={onClose} aria-label="Back" className="absolute left-2 top-2 z-30 grid h-11 w-11 place-items-center text-white md:left-4 md:top-3 md:text-ink-foreground">
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="flex h-full w-full items-center justify-center md:h-auto md:min-h-full md:gap-5 md:px-16">
        {/* LEFT column (laptop/desktop only): author + caption */}
        <aside className="hidden h-[calc(100dvh-var(--explore-header-h)-24px)] w-[min(300px,22vw)] shrink-0 flex-col items-end self-center pt-2 min-[1200px]:flex">
          <div className="w-full">
            {author}
            <Caption handle={item.handle} text={item.caption} className="mt-4" />
            {item.audio && <p className="mt-2 truncate text-[13px] text-ink-muted">♫ {item.audio}</p>}
          </div>
        </aside>

        {/* CENTRE: video */}
        <div
          className="explore-reel-video overflow-hidden bg-ink-soft md:rounded-lg"
          onTouchStart={(e) => (touchY.current = e.touches[0]?.clientY ?? 0)}
          onTouchEnd={(e) => {
            const dy = (e.changedTouches[0]?.clientY ?? touchY.current) - touchY.current;
            if (dy < -70) go(1);
            else if (dy > 70) go(-1);
          }}
        >
          {item.video ? (
            <video key={item.id} ref={videoRef} src={item.video} poster={item.img} loop playsInline muted={muted} className="absolute inset-0 h-full w-full object-cover" onTimeUpdate={(e) => setPct((e.currentTarget.currentTime / (e.currentTarget.duration || 1)) * 100)} />
          ) : (
            <img key={item.id} src={item.img} alt={item.caption} className="absolute inset-0 h-full w-full object-cover" />
          )}
          <button onClick={tap} aria-label={paused ? "Play" : "Pause"} className="absolute inset-0 z-10 h-full w-full cursor-pointer" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
          {paused && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/50">
              <Play className="h-7 w-7 fill-white text-white" />
            </span>
          )}
          {burst > 0 && <Heart key={burst} className="explore-burst pointer-events-none absolute left-1/2 top-1/2 z-20 -ml-12 -mt-12 h-24 w-24 fill-white text-white" />}
          <span className="absolute left-3 top-3 z-20 hidden bg-black/60 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white md:block">{item.tag}</span>
          <div className="absolute right-2 top-2 z-20 flex items-center gap-1 pr-0 md:right-3 md:top-3">
            {item.video && (
              <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} aria-pressed={!muted} className="grid h-11 w-11 place-items-center rounded-full bg-black/50 text-white">
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            )}
          </div>
          {/* mobile + tablet overlay: author, caption, audio (rail on mobile only) */}
          <div className="absolute inset-x-0 bottom-0 z-20 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] text-white md:p-4 min-[1200px]:hidden">
            <div className="max-w-[calc(100%-3.75rem)] md:max-w-full">
              {author}
              <Caption handle={item.handle} text={item.caption} className="mt-2 text-[13px] text-white md:mt-3 md:text-[14px]" />
              {item.audio && <p className="mt-1.5 truncate text-[12px] text-white/80 md:mt-2 md:text-[13px]">♫ {item.audio}</p>}
            </div>
          </div>
          {rail("absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-1.5 z-20 flex md:hidden")}
          <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/25">
            <div className="h-full bg-white" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* RIGHT: action rail beside the video (tablet and up) */}
        {rail("hidden shrink-0 self-end pb-3 md:flex")}

        {/* Comments panel beside the video (tablet and up); mobile uses a bottom sheet */}
        {md && commentsOpen && (
          <aside className="flex h-[calc(100dvh-var(--explore-header-h)-24px)] w-[min(360px,30vw)] min-w-[280px] shrink-0 flex-col self-center overflow-hidden rounded-lg border border-ink-border bg-ink" onWheel={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink-border px-4 py-3">
              <h2 className="text-[15px] font-semibold">Comments</h2>
              <button onClick={() => setCommentsOpen(false)} aria-label="Close comments" className="grid h-9 w-9 place-items-center">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CommentList item={item} />
            <CommentInput itemId={item.id} />
          </aside>
        )}
      </div>

      {/* up / down buttons on the right edge (tablet and up) */}
      <div className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        <button onClick={() => go(-1)} disabled={idx === 0} aria-label="Previous reel" className="grid h-11 w-11 place-items-center rounded-full bg-ink-soft disabled:opacity-30">
          <ChevronUp />
        </button>
        <button onClick={() => go(1)} disabled={idx === reels.length - 1} aria-label="Next reel" className="grid h-11 w-11 place-items-center rounded-full bg-ink-soft disabled:opacity-30">
          <ChevronDown />
        </button>
      </div>

      {!md && (
        <ResponsiveOverlay open={commentsOpen} onOpenChange={setCommentsOpen} title="Comments">
          <div className="flex h-[70dvh] flex-col">
            <h2 className="border-b border-ink-border px-4 py-3 text-center text-[15px] font-semibold">Comments</h2>
            <CommentList item={item} />
            <CommentInput itemId={item.id} />
          </div>
        </ResponsiveOverlay>
      )}
    </div>
  );
}
