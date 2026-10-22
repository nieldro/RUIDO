"use client";

import { MOTION_OK, gsap, useGSAP, whenIdle } from "@/lib/motion";

/**
 * Efectos de scroll globales (todo con transform/opacity/clip-path, creado en tiempo libre y apagado
 * con prefers-reduced-motion):
 *  - barra de progreso de lectura en la cabecera;
 *  - línea de acento que se dibuja en el borde superior de cada sección;
 *  - parallax del hero: el cuerpo sube y se apaga, el campo de ruido baja más lento;
 *  - cortina que revela la sección final (SEÑAL) como una página que se descubre;
 *  - los títulos se inclinan según la velocidad del scroll;
 *  - la cinta de herramientas avanza sola y acelera cuando se hace scroll.
 */
export function ScrollFx() {
  useGSAP(
    (_ctx, contextSafe) => {
      const setup = contextSafe!(() => {
        const mm = gsap.matchMedia();
        mm.add(MOTION_OK, () => {
          gsap.to("[data-progress]", {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.2 },
          });

          gsap.utils.toArray<HTMLElement>("[data-rule]").forEach((rule) => {
            gsap.from(rule, {
              scaleX: 0,
              ease: "none",
              scrollTrigger: { trigger: rule.parentElement, start: "top 94%", end: "top 55%", scrub: 0.3 },
            });
          });

          const heroST = { trigger: "#ruido", start: "top top", end: "bottom top", scrub: true };
          gsap.to("[data-hero-body]", { yPercent: -12, opacity: 0.15, ease: "none", scrollTrigger: heroST });
          gsap.to(".static-noise", { yPercent: 18, ease: "none", scrollTrigger: heroST });

          gsap.fromTo(
            "#senal",
            { clipPath: "inset(0 0 100% 0)" },
            {
              clipPath: "inset(0 0 0% 0)",
              ease: "none",
              scrollTrigger: { trigger: "#senal", start: "top 98%", end: "top 40%", scrub: 0.4 },
            },
          );

          // Inclinación por velocidad + velocidad de la cinta, en un único ticker.
          const titles = gsap.utils.toArray<HTMLElement>(".h-section");
          const skewTo = titles.length ? gsap.quickTo(titles, "skewY", { duration: 0.5, ease: "power3" }) : null;
          const track = document.querySelector("[data-marquee-track]");
          const drift = track ? gsap.to(track, { xPercent: -50, repeat: -1, duration: 45, ease: "none" }) : null;
          let last = window.scrollY;
          let speed = 1;
          const tick = () => {
            const y = window.scrollY;
            const v = y - last;
            last = y;
            skewTo?.(gsap.utils.clamp(-4, 4, v * 0.3));
            if (drift) {
              speed += (1 + Math.min(7, Math.abs(v) * 0.2) - speed) * 0.12;
              drift.timeScale(speed);
            }
          };
          gsap.ticker.add(tick);

          return () => {
            gsap.ticker.remove(tick);
            drift?.kill();
          };
        });
      });
      // Se espera a que las secciones terminen de hidratarse antes de tocar su DOM.
      let cancelIdle = () => {};
      const t = window.setTimeout(() => {
        cancelIdle = whenIdle(setup, 2000);
      }, 1200);
      return () => {
        window.clearTimeout(t);
        cancelIdle();
      };
    },
    { dependencies: [], revertOnUpdate: true },
  );

  return null;
}
