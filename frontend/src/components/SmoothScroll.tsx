"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/motion";
import { refreshBounds, scrollState, setLenis, updateScrollState } from "@/lib/scrollState";

/**
 * Un único ticker de GSAP mueve a Lenis (scroll suave), actualiza ScrollTrigger y escribe el estado
 * de scroll que leen el indicador y el canvas. Con prefers-reduced-motion no hay scroll suave.
 */
export function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    // En móvil, la barra del navegador cambia el alto de la ventana al hacer scroll: no es un resize real.
    ScrollTrigger.config({ ignoreMobileResize: true });
    const reduced = prefersReducedMotion();
    scrollState.reduced = reduced;

    let lenis: Lenis | null = null;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      lenis.on("scroll", ScrollTrigger.update);
      setLenis(lenis);
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

    // El body cambia de alto varias veces al cargar (fuentes, datos del backend). Se agrupa en un solo
    // refresh al final de la ráfaga: cada refresh de ScrollTrigger fuerza un layout completo.
    let timer = 0;
    let lastH = 0;
    let lastW = 0;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r && Math.abs(r.height - lastH) < 2 && Math.abs(r.width - lastW) < 2) return;
      if (r) {
        lastH = r.height;
        lastW = r.width;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        refreshBounds();
        ScrollTrigger.refresh();
      }, 200);
    });
    ro.observe(document.body);
    refreshBounds();

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("click", onClick);
      window.clearTimeout(timer);
      ro.disconnect();
      setLenis(null);
      lenis?.destroy();
    };
  }, []);

  return null;
}
