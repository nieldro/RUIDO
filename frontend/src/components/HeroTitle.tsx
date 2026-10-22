"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { scramble } from "@/lib/scramble";

/**
 * <h1> real con el nombre. Al montar, cada letra arranca como un glifo al azar y se "decodifica"
 * de izquierda a derecha. Después, a ratos (y cuando el mouse se mueve encima) dispara un glitch
 * RGB: dos capas rosa/cian recortadas con clip-path que se desplazan unos instantes.
 * Con prefers-reduced-motion queda el texto limpio, sin capas.
 */
export function HeroTitle({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const letters = Array.from(text);

  // Decodificación: antes del primer pintado para no mostrar el nombre limpio un instante.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    delete root.dataset.decoded;
    const run = scramble(root, { delay: 380, stagger: 90 });
    run.done.then(() => {
      root.dataset.decoded = "true";
    });
    return () => run.cancel();
  }, [text]);

  // Ráfagas de glitch: cada 2,8–5,5 s y cuando el mouse se mueve sobre el título.
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let timer = 0;
    let off = 0;
    let lastHover = 0;

    const burst = () => {
      if (root.dataset.decoded !== "true" || document.hidden) return;
      root.classList.add("is-glitching");
      window.clearTimeout(off);
      off = window.setTimeout(() => root.classList.remove("is-glitching"), 400);
    };
    const loop = () => {
      burst();
      timer = window.setTimeout(loop, 2800 + Math.random() * 2700);
    };
    timer = window.setTimeout(loop, 2600);

    const onMove = () => {
      const now = performance.now();
      if (now - lastHover < 700) return;
      lastHover = now;
      burst();
    };
    root.addEventListener("pointermove", onMove);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(off);
      root.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <h1 ref={ref} id="hero-name" aria-label={text} className={`glitch relative ${className}`}>
      <span aria-hidden="true" className="glitch-base">
        {letters.map((ch, i) => (
          <span key={i} data-ch={ch} className={ch === " " ? "whitespace-pre" : undefined}>
            {ch}
          </span>
        ))}
      </span>
      <span aria-hidden="true" className="glitch-layer" data-c="a">
        {text}
      </span>
      <span aria-hidden="true" className="glitch-layer" data-c="b">
        {text}
      </span>
    </h1>
  );
}
