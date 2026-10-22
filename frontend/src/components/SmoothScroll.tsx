"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/motion";
import { refreshBounds, scrollState, updateScrollState } from "@/lib/scrollState";

/**
 * Un único ticker de GSAP mueve a Lenis (scroll suave), actualiza ScrollTrigger y escribe el estado
 * de scroll que leen el indicador y el canvas. Con prefers-reduced-motion no hay scroll suave.
 */
export function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = prefersReducedMotion();
    scrollState.reduced = reduced;

    let lenis: Lenis | null = null;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      lenis.on("scroll", ScrollTrigger.update);
    }

    const tick = (time: number) => {
      lenis?.raf(time * 1000);
      updateScrollState();
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onPointer = (e: PointerEvent) => {
      scrollState.mouseX = e.clientX;
      scrollState.mouseY = e.clientY;
    };
    const onLeave = () => {
      scrollState.mouseX = -9999;
      scrollState.mouseY = -9999;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    // Los anclajes (#modelo…) pasan por Lenis para que el scroll sea continuo.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const el = document.getElementById(a.getAttribute("href")!.slice(1));
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: 0 });
      else el.scrollIntoView();
    };
    document.addEventListener("click", onClick);

    const ro = new ResizeObserver(() => {
      refreshBounds();
      ScrollTrigger.refresh();
    });
    ro.observe(document.body);
    refreshBounds();

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("click", onClick);
      ro.disconnect();
      lenis?.destroy();
    };
  }, []);

  return null;
}
