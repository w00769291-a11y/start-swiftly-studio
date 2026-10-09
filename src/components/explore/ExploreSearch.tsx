import { useEffect, useRef, useState, type KeyboardEvent as RKeyboardEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, X } from "lucide-react";
import type { ExploreProfile } from "@/lib/explore-data";
import { abbr, addRecent, clearRecents, getSuggestedProfiles, profileOf, removeRecent, searchProfiles, useExploreState } from "@/lib/explore-service";
import { cn } from "@/lib/utils";
import { BadgesFor } from "./CategoryBadges";
import { Avatar } from "./shared";

export function ExploreSearch({ fullscreen, onClose }: { fullscreen?: boolean; onClose?: () => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(!!fullscreen);
  const [results, setResults] = useState<ExploreProfile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sugg, setSugg] = useState<ExploreProfile[]>([]);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const st = useExploreState();
  const navigate = useNavigate();
  const term = q.trim();

  useEffect(() => {
    if (open && sugg.length === 0) void getSuggestedProfiles(5).then(setSugg);
  }, [open, sugg.length]);

  useEffect(() => {
    setActive(-1);
    if (!term) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      const r = await searchProfiles(term);
      if (!cancelled) {
        setResults(r);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [term]);

  useEffect(() => {
    if (fullscreen) return;
    const away = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [fullscreen]);

  const recents = st.recents.map((id) => profileOf(id)).filter((p): p is ExploreProfile => !!p);
  const rows: ExploreProfile[] = term ? (results ?? []) : [...recents, ...sugg];

  const pick = (p: ExploreProfile) => {
    addRecent(p.id);
    setOpen(false);
    onClose?.();
    void navigate({ to: "/u/$handle", params: { handle: p.id } });
  };
  const key = (e: RKeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      onClose?.();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(rows.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      const p = rows[active] ?? (term ? rows[0] : undefined);
      if (p) pick(p);
    }
  };

  const row = (p: ExploreProfile, i: number, removable?: boolean) => (
    <li key={`${p.id}-${i}`} role="option" aria-selected={active === i} className={cn("flex items-center gap-3 px-4 py-2", active === i ? "bg-ink-soft" : "hover:bg-ink-soft/60")}>
      <button onClick={() => pick(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Avatar name={p.fullName} size={44} />
        <span className="min-w-0">
          <span className="flex items-center gap-1 text-[14px] font-semibold">
            <span className="truncate">{p.username}</span>
            <BadgesFor handle={p.id} />
          </span>
          <span className="block truncate text-[13px] text-ink-muted">
            {p.fullName} · {p.type} · {abbr(p.followers)} followers
          </span>
        </span>
      </button>
      {removable && (
        <button onClick={() => removeRecent(p.id)} aria-label={`Remove ${p.username} from recent`} className="grid h-11 w-11 shrink-0 place-items-center text-ink-muted hover:text-ink-foreground">
          <X className="h-5 w-5" />
        </button>
      )}
    </li>
  );

  return (
    <div ref={wrap} className={cn("relative", fullscreen && "fixed inset-0 z-[55] bg-ink text-ink-foreground")}>
      <div className={cn("flex items-center gap-1", fullscreen && "border-b border-ink-border p-3 pt-[max(0.75rem,env(safe-area-inset-top))]")}>
        {fullscreen && (
          <button onClick={onClose} aria-label="Close search" className="grid h-11 w-11 shrink-0 place-items-center">
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg bg-ink-soft px-3 text-ink-muted focus-within:ring-1 focus-within:ring-ink-border">
          <Search className="h-5 w-5 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={key}
            autoFocus={fullscreen}
            role="combobox"
            aria-expanded={open}
            aria-label="Search profiles"
            placeholder="Search organizers, athletes, artists, clubs"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink-foreground outline-none placeholder:text-ink-muted"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear search" className="grid h-8 w-8 shrink-0 place-items-center">
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </div>

      {open && (
        <div className={cn(fullscreen ? "h-[calc(100dvh-4.75rem)] overflow-y-auto" : "absolute inset-x-0 top-full z-30 mt-2 max-h-[min(70dvh,480px)] overflow-y-auto rounded-xl border border-ink-border bg-ink text-ink-foreground shadow-2xl")}>
          {term ? (
            loading ? (
              <ul aria-busy="true" className="py-2">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-2">
                    <span className="h-11 w-11 animate-pulse rounded-full bg-ink-soft" />
                    <span className="space-y-2">
                      <span className="block h-3 w-32 animate-pulse rounded bg-ink-soft" />
                      <span className="block h-3 w-48 animate-pulse rounded bg-ink-soft" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : rows.length ? (
              <ul role="listbox" className="py-2">{rows.map((p, i) => row(p, i))}</ul>
            ) : (
              <p className="px-4 py-10 text-center text-[14px] text-ink-muted">No results found.</p>
            )
          ) : (
            <div className="py-2">
              {recents.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-4 py-2">
                    <h3 className="text-[15px] font-semibold">Recent</h3>
                    <button onClick={clearRecents} className="h-8 text-[13px] font-semibold text-primary">Clear all</button>
                  </div>
                  <ul role="listbox">{recents.map((p, i) => row(p, i, true))}</ul>
                </>
              )}
              {sugg.length > 0 && (
                <>
                  <h3 className="px-4 py-2 text-[15px] font-semibold">Suggested for you</h3>
                  <ul role="listbox">{sugg.map((p, i) => row(p, recents.length + i))}</ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
