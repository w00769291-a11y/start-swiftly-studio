import { PageHero } from "./PageHero";
import { EventGrid } from "./EventGrid";
import { categories, events, type Category } from "@/lib/data";

export function CategoryPage({ cat, title, text }: { cat: Category[]; title: string; text: string }) {
  const img = categories.find((c) => c.name === cat[0])?.img;
  const list = events.filter((e) => cat.includes(e.category));
  return (
    <>
      <PageHero eyebrow={cat.join(" · ")} title={title} text={text} img={img} />
      <div className="mx-auto max-w-[1480px] px-5 py-16 md:px-8">
        <EventGrid items={list} />
      </div>
    </>
  );
}
