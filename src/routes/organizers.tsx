import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/organizers")({
  head: () => ({
    meta: [
      { title: "For organizers — List your event on SAC COMMUNITY" },
      { name: "description", content: "Publish events, sell tickets, manage registrations and check-in, and grow your community across India." },
      { property: "og:title", content: "For organizers — SAC COMMUNITY" },
      { property: "og:description", content: "Put your event on the map." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <>
      <PageHero eyebrow="For organizers" title="Put it on the map." text="Publish your event, reach your audience, manage registrations and grow your community.">
        <Link to="/list-event" className="mt-8 inline-block bg-primary px-6 py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-primary-foreground">List an event</Link>
      </PageHero>
      <div className="mx-auto grid max-w-[1480px] gap-px bg-border px-0 md:grid-cols-4">
        {[["Publish", "Create a listing in minutes with schedules, venues and ticket tiers."], ["Ticketing", "Sell paid or free tickets with instant confirmations."], ["Attendees & check-in", "Manage registrations and scan guests at the gate."], ["Analytics", "See sales, reach and audience by city and state."]].map(([t, d], i) => (
          <div key={t} className="bg-background p-8 md:p-10">
            <p className="font-display text-6xl text-primary">0{i + 1}</p>
            <p className="mt-4 font-display text-3xl">{t}</p>
            <p className="mt-2 text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </>
  ),
});
