import { Link } from "@tanstack/react-router";

const cols: { title: string; links: { l: string; to?: string }[] }[] = [
  { title: "Discover", links: [{ l: "Events", to: "/events" }, { l: "Sports", to: "/sports" }, { l: "Arts", to: "/arts" }, { l: "Culture", to: "/culture" }, { l: "Gaming", to: "/gaming" }, { l: "Festivals", to: "/festivals" }] },
  { title: "Community", links: [{ l: "Athletes", to: "/athletes" }, { l: "Artists", to: "/athletes" }, { l: "Clubs", to: "/athletes" }, { l: "Colleges", to: "/athletes" }] },
  { title: "Organizers", links: [{ l: "List an Event", to: "/list-event" }, { l: "Organizer Dashboard", to: "/organizers" }, { l: "Ticketing", to: "/organizers" }, { l: "Analytics", to: "/organizers" }] },
  { title: "Support", links: [{ l: "Help" }, { l: "Contact" }, { l: "Terms" }, { l: "Privacy" }] },
];

export function Footer() {
  return (
    <footer className="bg-ink pb-24 text-ink-foreground md:pb-0">
      <div className="mx-auto max-w-[1480px] px-5 pt-20 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <p className="font-display text-4xl">SAC <span className="text-primary">COMMUNITY</span></p>
            <p className="mt-4 max-w-xs text-sm text-ink-muted">One platform. Every event. Across India.</p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{c.title}</p>
              <ul className="space-y-2.5 text-sm text-ink-muted">
                {c.links.map((x) => (
                  <li key={x.l}>
                    {x.to ? <Link to={x.to} className="hover:text-ink-foreground">{x.l}</Link> : <span className="cursor-default hover:text-ink-foreground">{x.l}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-16 select-none font-display text-[22vw] leading-[0.8] text-ink-soft md:text-[15vw]">SAC</p>
        <div className="flex flex-col justify-between gap-2 border-t border-ink-border py-6 text-xs text-ink-muted md:flex-row">
          <span>© SAC COMMUNITY</span>
          <span>Sports · Arts · Culture — made across India</span>
        </div>
      </div>
    </footer>
  );
}
