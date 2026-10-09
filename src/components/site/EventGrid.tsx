import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { formatPrice, type SacEvent } from "@/lib/data";

export function EventGrid({ items }: { items: SacEvent[] }) {
  if (!items.length) return <p className="py-20 text-center text-muted-foreground">No events match these filters yet.</p>;
  return (
    <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((e) => (
        <Link key={e.slug} to="/event/$slug" params={{ slug: e.slug }} className="group block">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <img src={e.img} alt={e.name} width={e.w} height={e.h} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute left-3 top-3 bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">{e.category}</span>
            <span className="absolute right-3 top-3 bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-foreground">{e.mode}</span>
          </div>
          <div className="mt-4 flex items-start justify-between gap-4 border-t border-foreground pt-3">
            <div>
              <h3 className="font-display text-2xl">{e.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{e.city} · {e.date}</p>
            </div>
            <p className="shrink-0 font-display text-xl text-primary">{formatPrice(e.price)}</p>
          </div>
          <span className="mt-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] group-hover:text-primary">View event <ArrowRight className="h-3.5 w-3.5" /></span>
        </Link>
      ))}
    </div>
  );
}
