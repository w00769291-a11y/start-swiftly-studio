import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Header search: closed by default (animated glass icon only); opens inline on large screens, drops below the header on smaller ones. */
export function SearchBar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [spin, setSpin] = useState(false);
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(pending.current), []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 120);
    const away = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { clearTimeout(t); document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div ref={wrap} className="relative flex items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          void navigate({ to: "/events", search: { q: q || undefined } });
        }}
        className={cn(
          "search-glow search-expand overflow-hidden rounded-full p-[2px] text-foreground",
          // below lg: dropdown under the header, anchored to the icon's right edge
          "absolute -right-[5.5rem] top-[calc(100%+0.5rem)] w-[calc(100vw-2rem)] origin-top-right sm:right-0 sm:w-[380px]",
          // lg+: inline inside the header, growing leftward from the icon
          "lg:static lg:top-auto lg:mr-2 lg:w-auto lg:origin-right",
          open
            ? "is-open visible lg:max-w-[320px]"
            : "pointer-events-none invisible lg:max-w-0",
        )}
      >
        <div className="flex h-10 items-center gap-2.5 rounded-full bg-background pl-4 pr-1 lg:h-9 lg:w-[300px] lg:min-w-[300px]">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events, artists, sports..."
            aria-label="Search"
            tabIndex={open ? 0 : -1}
            className="h-full w-full min-w-0 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          />
        </div>
      </form>
      <button
        type="button"
        aria-label={open ? "Close search" : "Open search"}
        aria-expanded={open}
        onPointerEnter={(e) => { if (e.pointerType === "mouse" && !open) setSpin(true); }}
        onClick={() => {
          if (open) { clearTimeout(pending.current); setOpen(false); return; }
          setOpen(true);
          setSpin(false);
          requestAnimationFrame(() => setSpin(true));
        }}
        onAnimationEnd={(e) => { if (e.target === e.currentTarget) setSpin(false); }}
        className={cn(
          "search-ring grid h-11 w-11 shrink-0 place-items-center rounded-full p-[2px] lg:h-9 lg:w-9",
          // inactive: soft breathing glow; hovering/active: existing one-shot twist
          open ? (spin && "glass-spinning") : spin ? "glass-spinning" : "search-breathe",
        )}
      >
        <span className="grid h-full w-full place-items-center rounded-full bg-ink text-ink-foreground">
          {open ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </span>
      </button>
    </div>
  );
}
