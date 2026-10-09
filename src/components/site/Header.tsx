import { Button } from "@/components/ui/button";
import { useAccount, signOutAccount } from "@/lib/account";
import { useQueryClient } from "@tanstack/react-query";
import { MyAvatar } from "@/components/site/MyAvatar";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { MapPin, Menu, X, ArrowLeft, CalendarDays, Newspaper, Volleyball, Palette, Gamepad2, Users, User, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SearchBar } from "./SearchBar";

const nav = [
  { label: "Events", to: "/events" },
  { label: "News", to: "/news" },
  { label: "Sports", to: "/sports" },
  { label: "Arts", to: "/arts" },
  { label: "Gaming", to: "/gaming" },
  { label: "Community", to: "/athletes" },
] as const;

// Hamburger menu: Account opens My Profile (the personal account page); Explore is reached via the Y avatar.
const desktopNav = [...nav, { label: "Account", to: "/my-sac" }] as const;

// Mobile-only menu rows (icon tile + title + subtitle). Order matches desktopNav + About.
const mobileNav = [
  { label: "Events", to: "/events", sub: "What's on near you", Icon: CalendarDays },
  { label: "News", to: "/news", sub: "Latest updates", Icon: Newspaper },
  { label: "Sports", to: "/sports", sub: "Matches and tournaments", Icon: Volleyball },
  { label: "Arts", to: "/arts", sub: "Shows and exhibitions", Icon: Palette },
  { label: "Gaming", to: "/gaming", sub: "Esports and arenas", Icon: Gamepad2 },
  { label: "Community", to: "/athletes", sub: "Clubs and organizers", Icon: Users },
  { label: "Account", to: "/my-sac", sub: "Profile and settings", Icon: User },
  { label: "About", to: "/about", sub: "Who we are", Icon: Info },
] as const;

// Same colour the Explore avatar derives for "you", kept local so the header does not pull in Explore code.

// Y-avatar hint: show in at most this many browser sessions, and never once Explore has been opened.
const HINT_MAX_SESSIONS = 6;
const HINT_STORAGE_KEY = "sac-pics-hint-v2";
const HINT_SESSION_KEY = "sac-pics-hint-session";
// Remount guard and storage-blocked fallback: the hint shows at most once per page load.
let hintShownThisLoad = false;

export function Header() {
  const router = useRouter();
  const account = useAccount();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onHero = pathname === "/";
  const onExplore = pathname === "/explore";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Launch hint on the Y avatar. Read storage after mount to avoid hydration mismatch.
  const [hint, setHint] = useState<"hidden" | "shown" | "closing">("hidden");
  useEffect(() => {
    // Testing link: ?showHint=1 forces the hint on without touching the stored counts.
    let forced = false;
    try { forced = new URLSearchParams(window.location.search).get("showHint") === "1"; } catch { /* ignore */ }
    if (forced) { setHint("shown"); return; }
    if (hintShownThisLoad) return; // remount guard + storage-blocked fallback: at most once per page load
    let state = { shown: 0, exploreOpened: false };
    try {
      const raw = window.localStorage.getItem(HINT_STORAGE_KEY);
      if (raw) state = { ...state, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    let shownThisSession = false;
    try { shownThisSession = window.sessionStorage.getItem(HINT_SESSION_KEY) !== null; } catch { /* ignore */ }
    if (shownThisSession || state.shown >= HINT_MAX_SESSIONS || state.exploreOpened) return;
    // Counts as one session the moment it appears, even if no button is pressed.
    hintShownThisLoad = true;
    try { window.sessionStorage.setItem(HINT_SESSION_KEY, "1"); } catch { /* ignore */ }
    try { window.localStorage.setItem(HINT_STORAGE_KEY, JSON.stringify({ ...state, shown: state.shown + 1 })); } catch { /* ignore */ }
    setHint("shown");
  }, []);
  // First visit to Explore (any route in) permanently retires the hint, hiding it immediately if visible.
  useEffect(() => {
    if (!onExplore) return;
    try {
      const raw = window.localStorage.getItem(HINT_STORAGE_KEY);
      const state = raw ? { shown: 0, exploreOpened: false, ...JSON.parse(raw) } : { shown: 0, exploreOpened: false };
      window.localStorage.setItem(HINT_STORAGE_KEY, JSON.stringify({ ...state, exploreOpened: true }));
    } catch { /* ignore */ }
    setHint("hidden");
  }, [onExplore]);
  const dismissHint = () => {
    setHint("closing");
    window.setTimeout(() => setHint("hidden"), 150);
  };

  const solid = scrolled || !onHero;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,height,box-shadow,color] duration-500 ease-out",
          solid
            ? "h-14 bg-background/95 text-foreground shadow-[0_1px_0_var(--color-border)] backdrop-blur-md"
            : "h-20 bg-transparent text-ink-foreground",
        )}
      >
        <div className="mx-auto flex h-full max-w-[1480px] items-center gap-2 px-4 sm:gap-6 md:px-8">
          {!onHero && (
            <button
              aria-label="Go back"
              onClick={() => {
                // Opened a community profile directly (no history): go to Community instead of doing nothing.
                if (pathname.startsWith("/community/") && window.history.length <= 1) void router.navigate({ to: "/athletes" });
                else router.history.back();
              }}
              className="-ml-2 grid h-10 w-10 shrink-0 place-items-center opacity-85 transition-opacity hover:opacity-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <Link to="/" className="shrink-0 whitespace-nowrap font-display text-base tracking-wide min-[360px]:text-lg sm:text-xl md:text-2xl">
            SAC <span className="text-primary">COMMUNITY</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {/* On Explore (tablet and up) search lives in the Explore rail instead. */}
            <div className={onExplore ? "contents md:hidden" : "contents"}>
              <SearchBar />
            </div>
            <button aria-label="Location" className="hidden h-10 md:flex items-center gap-1.5 px-2 text-[13px] font-semibold opacity-85 hover:opacity-100">
              <MapPin className="h-[18px] w-[18px]" />
              <span>All India</span>
            </button>
            {(["mobile", "desktop"] as const).map((kind) => {
              const avatar = (
                <span aria-hidden className={cn("grid rounded-full transition-shadow", solid ? "ring-1 ring-foreground/15" : "ring-1 ring-white")}>
                  <MyAvatar size={32} />
                </span>
              );
              const shell = kind === "mobile"
                ? "grid h-11 w-11 shrink-0 place-items-center md:hidden"
                : onExplore
                  ? "hidden"
                  : "hidden h-10 w-10 shrink-0 place-items-center md:grid";
              // Already on Explore: same avatar, no link, so a click cannot re-navigate or reload it.
              if (onExplore) {
                return (
                  <span key={kind} aria-label="Explore" aria-current="page" className={shell}>
                    {avatar}
                  </span>
                );
              }
              const wrap = kind === "mobile" ? "relative shrink-0 md:hidden" : "relative hidden shrink-0 md:block";
              return (
                <span key={kind} className={wrap}>
                  <Link to="/explore" aria-label="Explore" className="grid h-11 w-11 place-items-center md:h-10 md:w-10">
                    {avatar}
                  </Link>
                  {hint !== "hidden" && (
                    <>
                      <span aria-hidden className={cn("pointer-events-none absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background transition-opacity duration-150 motion-reduce:transition-none", hint === "closing" && "opacity-0")} />
                      <div
                        role="note"
                        className={cn(
                          "absolute right-0 top-full z-[60] mt-2 w-[min(196px,calc(100vw-24px))] rounded-[10px] border border-ink-border bg-ink px-2.5 py-2 text-left text-ink-foreground shadow-[0_10px_28px_-10px_oklch(0_0_0/0.6)] transition-opacity duration-150 motion-reduce:transition-none",
                          hint === "closing" && "opacity-0",
                        )}
                      >
                        <span aria-hidden className="absolute -top-[6px] right-[15px] h-2.5 w-2.5 rotate-45 border-l border-t border-ink-border bg-ink" />
                        <p className="text-[13px] font-medium leading-tight">Your pics feed lives here</p>
                        <div className="mt-1 flex items-center justify-between gap-x-1.5 whitespace-nowrap max-[359px]:whitespace-normal max-[359px]:flex-col max-[359px]:items-start">
                          <span className="text-[12px] leading-tight text-ink-muted">Reels and pics, all India</span>
                          <button
                            type="button"
                            aria-label="Got it"
                            onClick={dismissHint}
                            className="relative shrink-0 rounded-sm text-[12px] font-bold uppercase leading-tight tracking-[0.04em] text-primary before:absolute before:-inset-x-2 before:-inset-y-3.5 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                          >
                            Got it
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </span>
              );
            })}
            <Link
              to="/list-event"
              className="hidden bg-primary px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5 md:inline-block"
            >
              List an event
            </Link>
            {account.user ? <Button variant="ghost" size="sm" onClick={async () => { await signOutAccount(queryClient); await router.navigate({ to: "/login", replace: true }); }}>Log out</Button> : <Button asChild variant="ghost" size="sm"><Link to="/login">Log in</Link></Button>}
            <button ref={menuButtonRef} aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="grid h-11 w-11 place-items-center opacity-85 transition-opacity hover:opacity-100 md:h-10 md:w-10">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {open && <button aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default bg-ink/40" />}
      <div
        className={cn(
          "fixed right-3 top-[3.75rem] z-[70] w-[min(264px,calc(100vw-24px))] border border-ink-border bg-ink text-ink-foreground shadow-2xl transition-[opacity,visibility] duration-150 motion-reduce:transition-none md:w-[min(260px,calc(100vw-24px))] md:rounded-[10px] md:right-[max(2rem,calc((100vw-1480px)/2+2rem))]",
          open ? "visible opacity-100" : "invisible opacity-0",
          !solid && "top-[5.25rem]",
        )}
      >
        <nav
          aria-label="Main menu"
          className={cn(
            "flex flex-col overflow-y-auto overscroll-contain p-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:p-1.5",
            solid ? "max-h-[calc(100dvh-3.75rem-8px)]" : "max-h-[calc(100dvh-5.25rem-8px)]",
          )}
        >
          {mobileNav.map(({ label, to, sub, Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            const touchActive = "max-lg:active:bg-primary/28 pointer-coarse:active:bg-primary/28 max-lg:active:duration-100 pointer-coarse:active:duration-100 max-lg:duration-150 pointer-coarse:duration-150 [-webkit-tap-highlight-color:transparent]";
            const touchCurrent = active ? "max-lg:bg-primary/14 pointer-coarse:bg-primary/14 max-lg:shadow-[inset_3px_0_0_0_var(--color-primary)] pointer-coarse:shadow-[inset_3px_0_0_0_var(--color-primary)] max-lg:rounded-l-none pointer-coarse:rounded-l-none max-lg:rounded-r-lg pointer-coarse:rounded-r-lg" : "";
            const row = cn("flex min-h-[46px] cursor-pointer items-center gap-2.5 rounded-lg px-3 py-1.5 outline-none transition-[background-color,box-shadow] duration-[120ms] motion-reduce:transition-none [@media(min-width:1024px)_and_(pointer:fine)]:active:bg-primary/22 [@media(max-height:559px)]:min-h-10 md:min-h-0 md:px-2 md:[@media(hover:hover)_and_(pointer:fine)]:hover:bg-primary/14 md:[@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[inset_2px_0_0_0_var(--color-primary)] md:focus-visible:bg-primary/14 md:focus-visible:shadow-[inset_2px_0_0_0_var(--color-primary)] md:[@media(max-height:559px)]:min-h-0 md:[@media(max-height:559px)]:py-1", touchCurrent, touchActive);
            const body = (
              <>
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg max-[359px]:h-7 max-[359px]:w-7", active ? "bg-primary text-primary-foreground" : "bg-ink-foreground/10 text-ink-foreground")}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium leading-tight max-[359px]:text-[14px] md:text-[14px]">{label}</span>
                  <span className="block truncate text-[12px] leading-tight text-ink-muted [@media(max-height:559px)]:hidden">{sub}</span>
                </span>
              </>
            );
            return to === "/about" ? (
              <a key={label} href={to} aria-current={active ? "page" : undefined} className={row}>{body}</a>
            ) : (
              <Link key={label} to={to} aria-current={active ? "page" : undefined} className={row}>{body}</Link>
            );
          })}
          <Link to="/list-event" className="mx-1 mt-3 flex h-11 shrink-0 items-center justify-center bg-primary text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground md:hidden">
            List an event
          </Link>
        </nav>
      </div>

    </>
  );
}
