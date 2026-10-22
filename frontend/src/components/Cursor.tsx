"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

const INTERACTIVE = "a, button, input, select, textarea, [role='button'], summary, label";

/**
 * Marca propia que sigue al mouse (un cuadrado, sin radios, como el resto del sistema) y crece sobre lo
 * clicable. Solo con mouse real y sin movimiento reducido; el cursor nativo no se oculta nunca.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.22, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.22, ease: "power3" });
    const sTo = gsap.quickTo(el, "scale", { duration: 0.25, ease: "power3" });

    const move = (e: PointerEvent) => {
      el.style.opacity = "1";
      xTo(e.clientX);
      yTo(e.clientY);
      sTo((e.target as Element | null)?.closest?.(INTERACTIVE) ? 3.2 : 1);
    };
    const down = () => sTo(0.7);
    const up = (e: PointerEvent) => sTo((e.target as Element | null)?.closest?.(INTERACTIVE) ? 3.2 : 1);
    const leave = () => {
      el.style.opacity = "0";
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[70] -mt-[5px] -ml-[5px] size-2.5 bg-acid opacity-0 mix-blend-difference transition-opacity duration-200"
    />
  );
}
