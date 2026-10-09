import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Scroll-driven reveals, parallax, image zoom and pinned horizontal tracks. */
export function useScrollMotion(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia(scope.current ?? undefined);
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 48, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-lines]").forEach((el) => {
        gsap.from(el.querySelectorAll("[data-l]"), { yPercent: 110, duration: 1, stagger: 0.08, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-zoom]").forEach((el) => {
        gsap.fromTo(el, { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const amt = Number(el.dataset["parallax"] || 12);
        gsap.fromTo(el, { yPercent: amt }, { yPercent: -amt, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    });
    mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
      gsap.utils.toArray<HTMLElement>("[data-htrack]").forEach((track) => {
        const wrap = track.parentElement!;
        const dist = () => track.scrollWidth - wrap.clientWidth;
        gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: wrap.parentElement, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
      });
    });
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => {
      window.clearTimeout(t);
      mm.revert();
    };
  }, [scope]);
}
