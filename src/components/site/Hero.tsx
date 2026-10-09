import { memo, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowLeft, ArrowRight } from "lucide-react";
import heroSports from "@/assets/hero-sports.png";
import heroArts from "@/assets/hero-arts.png";
import heroCulture from "@/assets/hero-culture.png";

// Memoized + innerHTML so React never re-renders or reconciles the SplitText-owned chars.
const HeadlineLine = memo(function HeadlineLine({ text, accent }: { text: string; accent: boolean }) {
  return <span data-line className={`block ${accent ? "text-primary" : ""}`} dangerouslySetInnerHTML={{ __html: text }} />;
});

const slides = [
  { kicker: "Sports × Gaming", lines: ["Find your next", "challenge."], tag: "Where every move matters.", text: "From stadiums to gaming arenas, discover competitions, tournaments and experiences across India.", cta: "Explore sports", to: "/sports", img: heroSports, alt: "Indian sprinter in red India kit in a full running stride" },
  { kicker: "Arts × Events", lines: ["Find your next", "experience."], tag: "Where ideas become experiences.", text: "Discover performances, artists, live events and experiences happening across India.", cta: "Explore events", to: "/events", img: heroArts, alt: "Dancer mid-leap in flowing red fabric holding a microphone" },
  { kicker: "Culture × Festivals", lines: ["Experience", "India."], tag: "Discover the stories that bring India to life.", text: "Discover festivals, traditions, cultural experiences and unforgettable moments near you.", cta: "Discover culture", to: "/culture", img: heroCulture, alt: "Kathakali performer in red and gold costume" },
] as const;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const imgs = useRef<(HTMLDivElement | null)[]>([]);
  const texts = useRef<(HTMLDivElement | null)[]>([]);
  const headlineSplits = useRef<SplitText[]>([]);
  const cur = useRef(0);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const st = useRef<ScrollTrigger | null>(null);
  const lock = useRef(false);
  const reduced = useRef(false);
  const [idx, setIdx] = useState(0);

  const animateTo = (next: number) => {
    if (next === cur.current) return;
    const prev = cur.current;
    cur.current = next;
    setIdx(next);
    tl.current?.progress(1).kill();
    const outImg = imgs.current[prev];
    const inImg = imgs.current[next];
    const outT = texts.current[prev];
    const inT = texts.current[next];
    const inSplit = headlineSplits.current[next];
    if (!outImg || !inImg || !outT || !inT || !inSplit) return;

    if (reduced.current) {
      gsap.set([outImg, outT], { autoAlpha: 0 });
      gsap.set([inImg, inT], { autoAlpha: 1, x: 0, y: 0 });
      gsap.set(inT.querySelectorAll("[data-line],[data-fade]"), { yPercent: 0, y: 0, autoAlpha: 1 });
      gsap.set(inSplit.chars, { rotationZ: 0, opacity: 1 });
      return;
    }

    const mobile = window.innerWidth < 768;
    const R = mobile ? window.innerWidth * 0.22 : Math.min(window.innerWidth * 0.5, 820);
    const D = window.innerHeight * (mobile ? 0.28 : 0.95);
    const o = { p: 0 };
    const n = { p: 0 };
    const placeIn = () => {
      const a = (1 - n.p) * (Math.PI / 2);
      gsap.set(inImg, { x: R * Math.sin(a), y: -D * 0.3 * (1 - Math.cos(a)), scale: 0.9 + 0.1 * n.p, autoAlpha: Math.min(1, n.p * 2.2) });
    };
    const placeOut = () => {
      const a = o.p * (Math.PI / 2);
      gsap.set(outImg, { x: -R * 0.42 * (1 - Math.cos(a)), y: D * Math.sin(a), scale: 1 - 0.1 * o.p, autoAlpha: 1 - Math.max(0, (o.p - 0.55) / 0.45) });
    };
    placeIn();

    // Text has no exit motion: the outgoing block is swapped out instantly; the only headline motion is Domino Fall.
    gsap.set(inT.querySelectorAll("[data-line],[data-fade]"), { yPercent: 0, y: 0, autoAlpha: 1 });
    const t = gsap.timeline();
    t.set(outT, { autoAlpha: 0 }, 0.6)
      .to(o, { p: 1, duration: 1.1, ease: "power2.inOut", onUpdate: placeOut }, 0.1)
      .to(n, { p: 1, duration: 1.25, ease: "power3.out", onUpdate: placeIn }, 0.38)
      .set(inT, { autoAlpha: 1 }, 0.6)
      .fromTo(
        inSplit.chars,
        { rotationZ: -90, transformOrigin: "bottom left", opacity: 0 },
        { rotationZ: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: "power3.out", immediateRender: true },
        0.88,
      );
    tl.current = t;
  };

  const go = (dir: number) => {
    const next = (cur.current + dir + slides.length) % slides.length;
    const s = st.current;
    if (s) {
      lock.current = true;
      const y = s.start + ((next + 0.5) / slides.length) * (s.end - s.start);
      window.scrollTo({ top: y, behavior: "smooth" });
      window.setTimeout(() => (lock.current = false), 1100);
    }
    animateTo(next);
  };

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Split only the innerHTML-owned [data-line] spans so React never sees SplitText's nodes.
    headlineSplits.current = texts.current.flatMap((text) => {
      const lines = text?.querySelectorAll<HTMLElement>("[data-headline] [data-line]");
      return lines && lines.length ? [SplitText.create(Array.from(lines), { type: "chars", charsClass: "inline-block" })] : [];
    });
    const ctx = gsap.context(() => {
      imgs.current.forEach((el, i) => gsap.set(el, { autoAlpha: i === 0 ? 1 : 0, x: 0, y: 0 }));
      texts.current.forEach((el, i) => gsap.set(el, { autoAlpha: i === 0 ? 1 : 0 }));
      if (!reduced.current) {
        // intro
        const firstText = texts.current[0];
        const firstImage = imgs.current[0];
        const firstSplit = headlineSplits.current[0];
        if (firstText && firstImage && firstSplit) {
          gsap.timeline()
            .from(firstImage, { x: 160, y: -60, autoAlpha: 0, duration: 1.3, ease: "power3.out" }, 0)
            .from(firstSplit.chars, { rotationZ: -90, transformOrigin: "bottom left", opacity: 0, stagger: 0.06, duration: 0.5, ease: "power3.out" }, 0.52);
        }
        st.current = ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "+=180%",
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (lock.current) return;
            const i = Math.min(slides.length - 1, Math.floor(self.progress * slides.length * 0.9999));
            if (i !== cur.current) animateTo(i);
          },
        });
      }
    }, root);
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("load", onLoad);
      tl.current?.kill();
      ctx.revert();
      headlineSplits.current.forEach((split) => split.revert());
      headlineSplits.current = [];
    };
  }, []);

  return (
    <>
      <style>{`
        @media (max-width: 639px) {
          .athlete-spotlight {
            --hero-glow: radial-gradient(60% 55% at 60% 55%, oklch(0.5 0.2 27 / 0.55), transparent 70%),
              radial-gradient(30% 25% at 85% 20%, oklch(0.8 0.14 82 / 0.12), transparent 70%),
              linear-gradient(180deg, oklch(0.12 0.006 60), oklch(0.17 0.01 40));
          }
        }
      `}</style>
      <section ref={root} className="athlete-spotlight grain relative h-[100svh] min-h-[620px] overflow-hidden bg-hero text-ink-foreground">
        {/* desktop ambient (mobile ring lives inside the visual group) */}
        <div aria-hidden className="pointer-events-none absolute right-[4%] top-[12%] hidden h-[70vmin] w-[70vmin] rounded-full border border-ink-border lg:block" />
        <div aria-hidden className="pointer-events-none absolute right-[34%] top-[22%] hidden h-2 w-2 rounded-full bg-gold shadow-[0_0_24px_var(--color-gold)] lg:block" />
        <p aria-hidden className="pointer-events-none absolute -bottom-[4vw] left-[-1vw] select-none font-display text-[34vw] leading-none text-ink-foreground/[0.035]">
          0{idx + 1}
        </p>

        {/* text */}
        <div className="relative mx-auto flex h-full max-w-[1480px] flex-col px-5 pb-[calc(1rem_+_env(safe-area-inset-bottom))] pt-[72px] sm:pt-24 lg:static lg:pb-0 lg:px-8 lg:pt-24">
          <div className="relative z-10 mt-6 min-h-[clamp(212px,58vw,250px)] sm:mt-8 sm:min-h-[330px] lg:mt-0 lg:min-h-0 lg:grid">
            {slides.map((s, i) => (
              <div
                key={s.kicker}
                ref={(el) => {
                  texts.current[i] = el;
                }}
                className="absolute inset-x-0 top-0 max-w-[860px] lg:relative lg:[grid-area:1/1]"
                style={{ visibility: i === 0 ? "visible" : "hidden" }}
                aria-hidden={i !== idx}
              >
                <p data-fade className="mb-3 flex items-center gap-3 text-[11px] sm:mb-4 sm:text-[11px] lg:mb-8 font-bold uppercase tracking-[0.24em] sm:tracking-[0.3em] text-gold">
                  <span className="h-px w-8 bg-primary" /> {s.kicker}
                </p>
                <h1 data-headline aria-label={s.lines.join(" ")} className="font-display space-y-[0.26em] sm:space-y-[0.16em] text-[13vw] leading-[0.86] sm:text-[12vw] sm:leading-[0.88] lg:leading-[0.9] lg:text-[min(6.6vw,11svh)] xl:text-[min(108px,11svh)]">
                  {s.lines.map((l, j) => (
                    <span key={l} aria-hidden className="block overflow-hidden pb-[0.04em]">
                      <HeadlineLine text={l} accent={j === s.lines.length - 1} />
                    </span>
                  ))}
                </h1>
                <p data-fade className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] sm:mt-3 sm:text-xs sm:tracking-[0.22em] lg:mt-10 lg:text-sm text-ink-foreground/80">
                  “{s.tag}”
                </p>
                <p data-fade className="mt-2 max-w-[340px] text-[14px] leading-snug sm:max-w-[420px] sm:mt-3 sm:text-[15px] sm:leading-relaxed lg:mt-5 lg:text-[15px] leading-relaxed text-ink-muted lg:text-base">
                  {s.text}
                </p>
              </div>
            ))}
          </div>

          {/* visual: athlete + spotlight as one group (mobile); desktop keeps section-anchored placement */}
          <div className="relative my-3 min-h-[160px] flex-1 lg:static lg:m-0 lg:min-h-0 lg:flex-none">
            <div className="absolute inset-y-0 right-0 aspect-[896/1152] max-w-full max-sm:right-auto max-sm:left-1/2 max-sm:-translate-x-1/2 lg:contents">
              <div aria-hidden className="pointer-events-none absolute left-1/2 top-[48%] aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink-border bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-primary)_28%,transparent)_0%,transparent_62%)] lg:hidden" />
              <div aria-hidden className="pointer-events-none absolute left-[6%] top-[8%] h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_18px_var(--color-gold)] lg:hidden" />
              {slides.map((s, i) => (
                <div
                  key={s.kicker}
                  ref={(el) => {
                    imgs.current[i] = el;
                  }}
                  className="absolute inset-0 will-change-transform lg:inset-auto lg:bottom-0 lg:h-[min(calc(100svh_-_110px),60vw)] lg:right-[6%]"
                  style={{ visibility: i === 0 ? "visible" : "hidden" }}
                >
                  <img
                    src={s.img}
                    alt={s.alt}
                    width={896}
                    height={1152}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    className="h-full w-full object-contain object-bottom drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)] lg:w-auto lg:max-w-none lg:object-right-bottom"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* controls + CTA */}
          <div className="relative z-10 flex flex-nowrap items-center gap-3 sm:gap-6 lg:mt-14 lg:mb-[max(1.5rem,4svh)] lg:gap-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => go(-1)} aria-label="Previous slide" className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center border border-ink-border lg:h-10 lg:w-10 bg-ink-foreground/5 transition-colors hover:border-primary hover:bg-primary">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <p className="whitespace-nowrap px-0.5 font-display text-lg sm:px-1 sm:text-xl tabular-nums text-ink-foreground">
                0{idx + 1} <span className="text-ink-muted">/ 03</span>
              </p>
              <button onClick={() => go(1)} aria-label="Next slide" className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center border border-ink-border lg:h-10 lg:w-10 bg-ink-foreground/5 transition-colors hover:border-primary hover:bg-primary">
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <Link to="/events" className="group inline-flex shrink-0 items-center gap-2 bg-primary px-4 py-3 text-[11px] tracking-[0.12em] sm:py-3.5 sm:gap-3 sm:px-6 sm:text-[12px] font-bold lg:px-6 lg:py-3.5 lg:text-[12px] uppercase sm:tracking-[0.16em] text-primary-foreground">
              Explore events
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>


        </div>
      </section>
    </>
  );
}
