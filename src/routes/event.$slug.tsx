import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, CalendarDays, MapPin, Share2, Clock, ArrowLeft } from "lucide-react";
import { events, formatPrice } from "@/lib/data";
import { toggleSaved, useSaved } from "@/lib/saved";
import { EventGrid } from "@/components/site/EventGrid";

export const Route = createFileRoute("/event/$slug")({
  loader: ({ params }) => {
    const event = events.find((e) => e.slug === params.slug);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Event not found — SAC COMMUNITY" }, { name: "description", content: "This event could not be found on SAC COMMUNITY." }, { property: "og:title", content: "Event not found — SAC COMMUNITY" }, { property: "og:description", content: "This event could not be found on SAC COMMUNITY." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] };
    const e = loaderData.event;
    return {
      meta: [
        { title: `${e.name} — ${e.city} | SAC COMMUNITY` },
        { name: "description", content: e.description },
        { property: "og:title", content: `${e.name} — ${e.city}` },
        { property: "og:description", content: e.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: EventNotFound,
  component: EventDetail,
});

function EventNotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-40 text-center">
      <p className="font-display text-5xl">Event not found</p>
      <Link to="/events" className="mt-6 inline-block text-primary">Browse all events →</Link>
    </div>
  );
}

function EventDetail() {
  const { event: e } = Route.useLoaderData();
  const saved = useSaved();
  const isSaved = saved.includes(e.slug) || saved.includes(`event:${e.slug}`);
  const related = events.filter((x) => x.slug !== e.slug && (x.category === e.category || x.state === e.state)).slice(0, 3);
  const schedule = [["Gates open", "−60 min"], ["Opening", e.time], ["Main programme", "+90 min"], ["Close", "+4 hrs"]];

  return (
    <>
      <section className="relative h-[72vh] min-h-[480px] overflow-hidden bg-ink text-ink-foreground">
        <img src={e.img} alt={e.name} width={e.w} height={e.h} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1480px] px-5 pb-12 md:px-8">
          <Link to="/events" className="mb-6 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted hover:text-ink-foreground"><ArrowLeft className="h-4 w-4" /> All events</Link>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">{e.category} · {e.mode}</p>
          <h1 className="mt-3 max-w-5xl font-display text-[13vw] md:text-[7vw] xl:text-[110px]">{e.name}</h1>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold"><BadgeCheck className="h-4 w-4 text-primary" /> {e.organizer} · Verified organizer</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1480px] gap-12 px-5 py-16 md:px-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-14">
          <div className="grid gap-6 border-y py-6 sm:grid-cols-3">
            <p className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-primary" /><span><b className="block">{e.date}</b><span className="text-sm text-muted-foreground">Date</span></span></p>
            <p className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><span><b className="block">{e.time}</b><span className="text-sm text-muted-foreground">Start time</span></span></p>
            <p className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><span><b className="block">{e.venue}</b><span className="text-sm text-muted-foreground">{e.city}, {e.state}</span></span></p>
          </div>
          <div>
            <h2 className="font-display text-4xl">About</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{e.description}</p>
          </div>
          <div>
            <h2 className="font-display text-4xl">Schedule</h2>
            <div className="mt-4 border-t">
              {schedule.map(([a, b]) => (
                <div key={a} className="flex justify-between border-b py-4"><span className="font-semibold">{a}</span><span className="text-muted-foreground">{b}</span></div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-4xl">Venue</h2>
            <p className="mt-4 text-muted-foreground">{e.venue}, {e.city}, {e.state}, India. Accessible entry, parking and public transport nearby.</p>
          </div>
          <div className="bg-muted p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Organizer</p>
            <p className="mt-2 flex items-center gap-2 font-display text-3xl">{e.organizer} <BadgeCheck className="h-5 w-5 text-primary" /></p>
            <p className="mt-2 text-sm text-muted-foreground">Verified by SAC COMMUNITY · 24 events hosted</p>
          </div>
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="border-2 border-foreground p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tickets from</p>
            <p className="font-display text-6xl text-primary">{formatPrice(e.price)}</p>
            <Link to="/login" className="mt-6 block bg-primary py-4 text-center text-[12px] font-bold uppercase tracking-[0.16em] text-primary-foreground">{e.price === 0 ? "Register free" : "Book tickets"}</Link>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                aria-pressed={isSaved}
                onClick={() => {
                  if (isSaved) [e.slug, `event:${e.slug}`].filter((k) => saved.includes(k)).forEach(toggleSaved);
                  else toggleSaved(e.slug);
                }}
                className={`flex items-center justify-center gap-2 border py-3 text-[11px] font-bold uppercase tracking-[0.14em]${isSaved ? " text-primary" : ""}`}
              ><Bookmark className={`h-4 w-4${isSaved ? " fill-current" : ""}`} /> {isSaved ? "Saved" : "Save"}</button>
              <button onClick={() => navigator.share?.({ title: e.name, url: location.href })} className="flex items-center justify-center gap-2 border py-3 text-[11px] font-bold uppercase tracking-[0.14em]"><Share2 className="h-4 w-4" /> Share</button>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mx-auto max-w-[1480px] px-5 pb-24 md:px-8">
          <h2 className="mb-8 border-b-2 border-foreground pb-4 font-display text-5xl">Related events</h2>
          <EventGrid items={related} />
        </section>
      )}
    </>
  );
}
