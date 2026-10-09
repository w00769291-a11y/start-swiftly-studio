import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, text, img, children }: { eyebrow: string; title: string; text?: string; img?: string | undefined; children?: ReactNode }) {
  return (
    <section className="grain relative overflow-hidden bg-ink text-ink-foreground">
      {img && (
        <>
          <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        </>
      )}
      <div className="relative mx-auto max-w-[1480px] px-5 pb-14 pt-32 md:px-8 md:pb-20 md:pt-44">
        <p className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.28em] text-gold">
          <span className="h-px w-8 bg-primary" />
          {eyebrow}
        </p>
        <h1 className="font-display text-[16vw] md:text-[9vw] xl:text-[140px]">{title}</h1>
        {text && <p className="mt-5 max-w-lg text-lg text-ink-muted">{text}</p>}
        {children}
      </div>
    </section>
  );
}
