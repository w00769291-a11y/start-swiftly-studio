import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { events, formatPrice, type SacEvent } from "@/lib/data";
import { toggleSaved, useSaved } from "@/lib/saved";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/tickets")({
  head: () => ({
    meta: [
      { title: "Tickets — SAC COMMUNITY" },
      { name: "description", content: "Your saved events, purchased tickets and booking history in one place." },
      { property: "og:title", content: "Tickets — SAC COMMUNITY" },
      { property: "og:description", content: "Your saved events, purchased tickets and booking history in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { tab?: Tab | undefined } => ({ tab: (TABS as readonly string[]).includes(s["tab"] as string) ? (s["tab"] as Tab) : undefined }),
  component: TicketsPage,
});

const TABS = ["All", "Saved Events", "Purchased", "Booking History"] as const;
type Tab = (typeof TABS)[number];

function eventTime(event: SacEvent) {
  if (event.date === "Today" || event.date === "Tonight") return new Date().setHours(23, 59, 59, 999);
  const parsed = Date.parse(event.date);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function byEventDate(a: SacEvent, b: SacEvent) {
  const now = Date.now();
  const aTime = eventTime(a);
  const bTime = eventTime(b);
  const aPast = aTime < now;
  const bPast = bTime < now;
  if (aPast !== bPast) return aPast ? 1 : -1;
  return aPast ? bTime - aTime : aTime - bTime;
}

function TicketsPage() {
  const [tab, setTab] = useState<Tab>(Route.useSearch().tab ?? "All");
  const searchTab = Route.useSearch().tab;
  useEffect(() => { if (searchTab) setTab(searchTab); }, [searchTab]);
  const saved = useSaved();

  // No purchase store exists yet, so Purchased is empty until bookings are wired up.
  const purchased: SacEvent[] = [];
  // No booking-history source exists yet, so history remains empty rather than inventing records.
  const bookingHistory: SacEvent[] = [];
  const savedEvents = events
    .filter((event) => saved.includes(event.slug) || saved.includes(`event:${event.slug}`))
    .sort(byEventDate);
  const all = [...new Map([...savedEvents, ...purchased].map((event) => [event.slug, event])).values()].sort(byEventDate);
  const list = tab === "All"
    ? all
    : tab === "Saved Events"
      ? savedEvents
      : tab === "Purchased"
        ? purchased
        : bookingHistory;
  const empty: Record<Tab, string> = {
    All: "No saved events or purchased tickets yet.",
    "Saved Events": "No saved events yet.",
    Purchased: "No purchased tickets yet.",
    "Booking History": "No booking history yet.",
  };

  const removeSavedEvent = (event: SacEvent) => {
    [event.slug, `event:${event.slug}`]
      .filter((savedKey) => saved.includes(savedKey))
      .forEach(toggleSaved);
  };

  return (
    <div className="min-h-[100svh] bg-background px-4 pb-20 pt-24 text-foreground md:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-5xl">Tickets</h1>
        <div role="tablist" aria-label="Ticket filters" className="mt-6 flex max-w-full gap-1 overflow-x-auto border-b">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("relative h-11 shrink-0 px-3 text-[12px] font-bold uppercase tracking-[0.16em]", tab === t ? "text-foreground" : "text-muted-foreground")}
            >
              {t}
              <span className={cn("absolute inset-x-2 -bottom-px h-0.5 bg-primary transition-transform", tab === t ? "scale-x-100" : "scale-x-0")} />
            </button>
          ))}
        </div>
        <ul className="mt-5 space-y-3">
          {list.map((e) => (
            <li key={e.slug} className="flex min-w-0 items-center border hover:bg-accent/40">
              <Link to="/event/$slug" params={{ slug: e.slug }} className="flex min-w-0 flex-1 items-center gap-4 p-3">
                <img src={e.img} alt="" className="h-16 w-16 shrink-0 object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{e.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{e.date} · {e.city}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold">{formatPrice(e.price)}</span>
              </Link>
              {(tab === "All" || tab === "Saved Events") && savedEvents.some((event) => event.slug === e.slug) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${e.name} from saved events`}
                  aria-pressed="true"
                  title="Remove from saved events"
                  onClick={() => removeSavedEvent(e)}
                  className="mr-2 h-11 w-11 shrink-0 text-primary"
                >
                  <Bookmark className="fill-current" />
                </Button>
              )}
            </li>
          ))}
          {list.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">{empty[tab]}</li>}
        </ul>
      </div>
    </div>
  );
}
