import { useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, ScrollTrigger, useGSAP };

const QUERY = "(prefers-reduced-motion: reduce)";
/** Condición de gsap.matchMedia: todo efecto de scroll vive aquí y desaparece con movimiento reducido. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const DESKTOP = "(min-width: 768px)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** true si el usuario pidió menos movimiento. En el servidor devuelve false. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

/** Curva fuerte de salida; equivale al token --ease-out de globals.css. */
export const EASE_OUT = "expo.out";

/**
 * Ejecuta `cb` cuando el navegador está libre (o a los 200 ms si no hay requestIdleCallback). Devuelve la
 * función que lo cancela. Las animaciones de cada sección se crean así, una por tarea, en vez de todas
 * juntas durante la hidratación: crear ~40 ScrollTrigger seguidos fuerza un layout por cada uno.
 */
export function whenIdle(cb: () => void, timeout = 1200): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (w.requestIdleCallback && w.cancelIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(cb, 200);
  return () => window.clearTimeout(id);
}
