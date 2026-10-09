import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/list-event")({
  head: () => ({
    meta: [
      { title: "List your event — SAC COMMUNITY" },
      { name: "description", content: "Submit your sports, arts, culture or gaming event to SAC COMMUNITY for review." },
      { property: "og:title", content: "List your event — SAC COMMUNITY" },
      { property: "og:description", content: "Submit your event to reach audiences across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListEventPage,
});

const field = "w-full border-b-2 border-foreground/80 bg-transparent py-3 text-[15px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const label = "block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground";

function F({ l, children, wide }: { l: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={cn("block min-w-0", wide && "sm:col-span-2")}>
      <span className={label}>{l}</span>
      {children}
    </label>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-border pt-8">
      <legend className="flex items-baseline gap-3 font-display text-2xl sm:text-3xl">
        <span className="text-primary">{n}</span>
        {title}
      </legend>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function ListEventPage() {
  const [done, setDone] = useState(false);
  const [paid, setPaid] = useState<"free" | "paid">("free");

  return (
    <div className="min-h-[100svh] bg-ink px-4 pb-16 pt-24 text-ink-foreground sm:px-6 md:pt-28">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">For organizers</p>
        <h1 className="mt-2 font-display text-4xl leading-none sm:text-6xl">List your event</h1>
        <p className="mt-3 max-w-xl text-sm text-ink-muted sm:text-base">Tell us about your event. Our team reviews every submission before it goes live.</p>

        <div className="mt-8 bg-background p-5 text-foreground sm:p-8 md:p-10">
          {done ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 font-display text-3xl sm:text-4xl">Event submitted for review.</h2>
              <p className="mt-2 text-sm text-muted-foreground">We'll reach out on the contact email you provided.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button onClick={() => setDone(false)} className="bg-primary px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-primary-foreground">Submit another</button>
                <Link to="/organizers" className="border border-foreground px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em]">Back to organizers</Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setDone(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="space-y-10"
            >
              <Section n="01" title="Event details">
                <F l="Event name" wide><input required maxLength={120} className={field} placeholder="e.g. Mumbai City Marathon" /></F>
                <F l="Domain">
                  <select required defaultValue="" className={field}>
                    <option value="" disabled>Select domain</option>
                    <option>Sports</option><option>Arts</option><option>Culture</option><option>Gaming</option>
                  </select>
                </F>
                <F l="Event category"><input required maxLength={60} className={field} placeholder="e.g. Football, Music, Esports" /></F>
                <F l="Description" wide><textarea required maxLength={2000} rows={4} className={cn(field, "resize-y")} placeholder="What should attendees know?" /></F>
                <F l="Event image" wide><input type="file" accept="image/*" className={cn(field, "file:mr-3 file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:uppercase file:tracking-[0.12em] file:text-background")} /></F>
              </Section>

              <Section n="02" title="Date & location">
                <F l="Event date" wide><input required type="date" className={field} /></F>
                <F l="Start time"><input required type="time" className={field} /></F>
                <F l="End time"><input type="time" className={field} /></F>
                <F l="Venue" wide><input required maxLength={120} className={field} placeholder="Venue name and address" /></F>
                <F l="City"><input required maxLength={60} className={field} /></F>
                <F l="State"><input required maxLength={60} className={field} /></F>
              </Section>

              <Section n="03" title="Organizer details">
                <F l="Organizer / organization name" wide><input required maxLength={120} className={field} /></F>
                <F l="Contact email"><input required type="email" maxLength={255} className={field} /></F>
                <F l="Contact phone"><input required type="tel" maxLength={20} pattern="[0-9+\s\-]{7,20}" className={field} /></F>
              </Section>

              <Section n="04" title="Ticketing / registration">
                <div className="sm:col-span-2">
                  <span className={label}>Entry</span>
                  <div className="mt-3 flex gap-2">
                    {(["free", "paid"] as const).map((v) => (
                      <button type="button" key={v} aria-pressed={paid === v} onClick={() => setPaid(v)} className={cn("h-11 flex-1 border text-[12px] font-bold uppercase tracking-[0.16em] sm:flex-none sm:px-8", paid === v ? "border-primary bg-primary text-primary-foreground" : "border-foreground/30")}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                {paid === "paid" && (
                  <F l="Ticket price — INR">
                    <input type="text" inputMode="numeric" maxLength={12} pattern="[0-9₹,\s]*" className={field} placeholder="₹499" />
                  </F>
                )}
                <F l={paid === "paid" ? "Ticket / entry info" : "Registration info"} wide><textarea maxLength={1000} rows={3} className={cn(field, "resize-y")} placeholder={paid === "paid" ? "General ₹499 · VIP ₹999" : "e.g. Open to all, limited spots"} /></F>
                <F l="Registration link (optional)" wide><input type="url" maxLength={500} className={field} placeholder="https://" /></F>
              </Section>

              <button type="submit" className="w-full bg-primary py-4 text-[12px] font-bold uppercase tracking-[0.16em] text-primary-foreground transition-transform hover:-translate-y-0.5 sm:w-auto sm:px-12">Submit event</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
