import { useMyProfile } from "@/lib/my-profile";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Heart, Send } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { avatarFor, type ExploreItem } from "@/lib/explore-data";
import { addComment, allComments, toast, toggleCommentLike, useExploreState } from "@/lib/explore-service";
import { cn } from "@/lib/utils";
import { BadgesFor } from "./CategoryBadges";

export function useMq(query: string) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const q = window.matchMedia(query);
    const on = () => setM(q.matches);
    on();
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, [query]);
  return m;
}

const hue = (s: string) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7);

/** Round avatar. `ring` shows the story ring (unseen = animated, seen = grey). */
export function Avatar({ name, size = 36, ring = "none", pad = 2, self, src }: { name: string; size?: number; ring?: "unseen" | "seen" | "none"; pad?: number; self?: boolean; src?: string | null | undefined }) {
  const me = useMyProfile();
  const isMe = self ?? (name === "you" || name === "You");
  const photo = src ?? (isMe ? me.photo : avatarFor(name));
  const bg = isMe ? me.hue : hue(name);
  const letter = isMe ? me.initial : name[0]?.toUpperCase();
  return (
    <span
      className={cn("explore-story-ring grid shrink-0 place-items-center", ring === "seen" && "is-seen", ring === "none" && "is-none")}
      style={{ width: size, height: size, padding: ring === "none" ? 0 : pad }}
    >
      <span
        className="grid h-full w-full place-items-center overflow-hidden rounded-full font-bold text-white"
        style={{ background: `oklch(0.5 0.14 ${bg})`, border: ring === "none" ? 0 : `${pad}px solid var(--ink)`, fontSize: Math.max(11, size * 0.34) }}
      >
        {photo ? <img src={photo} alt={name} className="h-full w-full rounded-full object-cover" /> : letter}
      </span>
    </span>
  );
}

/** Centered dialog on tablet/laptop/desktop, draggable bottom sheet on mobile. */
export function ResponsiveOverlay({ open, onOpenChange, title, children, wide }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode; wide?: boolean }) {
  const desktop = useMq("(min-width: 768px)");
  if (desktop)
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-xl border-ink-border bg-ink p-0 text-ink-foreground", wide ? "h-[min(88dvh,760px)] w-[min(94vw,1100px)] max-w-none" : "w-[min(92vw,400px)] max-w-none")}>
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    );
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88dvh] border-ink-border bg-ink pb-[env(safe-area-inset-bottom)] text-ink-foreground">
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        {children}
      </DrawerContent>
    </Drawer>
  );
}

export async function shareItem(item: ExploreItem) {
  const url = `${window.location.origin}/explore?reel=${item.id}`;
  try {
    if (navigator.share) await navigator.share({ title: item.creator, text: item.caption, url });
    else {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    }
  } catch {
    /* user cancelled */
  }
}

export function Caption({ handle, text, className }: { handle: string; text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && !open) setLong(el.scrollHeight > el.clientHeight + 1);
  }, [text, open]);
  return (
    <p ref={ref} className={cn("text-[14px] leading-[18px] text-ink-foreground", !open && "line-clamp-2", className)}>
      <span className="mr-1.5 font-semibold">{handle}</span>
      {text}
      {long && !open && (
        <button onClick={() => setOpen(true)} className="ml-1 text-ink-muted hover:text-ink-foreground">
          more
        </button>
      )}
    </p>
  );
}

export function CommentList({ item, className }: { item: ExploreItem; className?: string }) {
  const st = useExploreState();
  const list = allComments(item, st);
  return (
    <ul className={cn("min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4", className)}>
      {list.length === 0 && <li className="py-8 text-center text-sm text-ink-muted">No comments yet. Start the conversation.</li>}
      {list.map((c) => {
        const liked = st.commentLikes.includes(c.id);
        return (
          <li key={c.id} className="flex items-start gap-3">
            <Avatar name={c.author} size={32} />
            <div className="min-w-0 flex-1 text-[14px] leading-[18px]">
              <span className="mr-1.5 inline-flex max-w-full items-center gap-1 align-middle">
                <span className="truncate font-semibold">{c.author}</span>
                <BadgesFor handle={c.author} />
              </span>
              <span className="break-words">{c.text}</span>
            </div>
            <button onClick={() => toggleCommentLike(c.id)} aria-pressed={liked} aria-label={liked ? "Unlike comment" : "Like comment"} className="grid h-8 w-8 shrink-0 place-items-center text-ink-muted hover:text-ink-foreground">
              <Heart className={cn("h-4 w-4", liked && "fill-primary text-primary")} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CommentInput({ itemId, className, autoFocus }: { itemId: string; className?: string; autoFocus?: boolean }) {
  const [text, setText] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    void addComment(itemId, t);
    setText("");
  };
  return (
    <form onSubmit={submit} className={cn("flex items-center gap-2 border-t border-ink-border px-4 py-2", className)}>
      <input
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment…"
        aria-label="Add a comment"
        className="h-11 min-w-0 flex-1 bg-transparent text-[14px] text-ink-foreground outline-none placeholder:text-ink-muted"
      />
      <button type="submit" disabled={!text.trim()} aria-label="Post comment" className="grid h-11 w-11 place-items-center text-primary disabled:opacity-40">
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
}

/** Kept for callers of the shared marker; delegates to the same category badge. */
export const Verified = ({ handle }: { handle: string }) => <BadgesFor handle={handle} />;
export const repostCount = (i: ExploreItem) => Math.max(2, Math.round(i.likes * 0.08));
export const shareCount = (i: ExploreItem) => Math.max(3, Math.round(i.likes * 0.2));
