import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { stories } from "@/lib/data";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & stories — SAC COMMUNITY" },
      { name: "description", content: "Sports results, arts, culture, esports and college event stories from across India." },
      { property: "og:title", content: "News & stories — SAC COMMUNITY" },
      { property: "og:description", content: "Stories, results and announcements from across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <>
      <PageHero eyebrow="Stories · Results · Announcements" title="News" />
      <div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-16 md:grid-cols-2 md:px-8">
        {stories.map((s) => (
          <article key={s.slug} className="group">
            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
              <img src={s.img} alt={s.title} width={s.w} height={s.h} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{s.category} · {s.date}</p>
            <h2 className="mt-2 font-display text-4xl">{s.title}</h2>
            <ArrowRight className="mt-3 h-5 w-5" />
          </article>
        ))}
      </div>
    </>
  ),
});
