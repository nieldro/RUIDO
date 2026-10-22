"use client";

import { useRef } from "react";
import { useLocale } from "@/lib/locale";
import { MOTION_OK, gsap, useGSAP, whenIdle } from "@/lib/motion";

export function Limpieza() {
  const { t } = useLocale();
  const l = t.limpieza;
  const root = useRef<HTMLElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const setup = contextSafe!(() => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // El título entra tapado por arriba y sube: una sola vez.
        gsap.from("[data-fx=title]", {
          clipPath: "inset(0 0 100% 0)",
          yPercent: 18,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-fx=title]", start: "top 88%", toggleActions: "play none none none" },
        });
        gsap.from("[data-fx=bio] p", {
          opacity: 0,
          y: 16,
          duration: 0.7,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-fx=bio]", start: "top 85%", toggleActions: "play none none none" },
        });
        // Las columnas se "construyen" con el scroll mientras las partículas caen y se apilan.
        gsap.from("[data-skill-col]", {
          opacity: 0,
          y: 40,
          stagger: 0.07,
          ease: "none",
          scrollTrigger: { trigger: "[data-fx=cols]", start: "top 92%", end: "top 42%", scrub: 0.6 },
        });
      });
      });
      return whenIdle(setup);
    },
    { scope: root, dependencies: [], revertOnUpdate: true },
  );

  return (
    <section
      ref={root}
      id="limpieza"
      data-section="limpieza"
      aria-labelledby="limpieza-title"
      className="border-t border-line py-20 sm:py-32"
    >
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <h2 id="limpieza-title" data-fx="title" className="display h-section">
            {l.title}
          </h2>
          <div data-fx="bio" className="max-w-[62ch] space-y-5 pt-2 text-fg2 lg:pt-6">
            {l.bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        <h3 className="mt-20 mb-4 text-xs text-mute sm:mt-28">{l.skillsLabel}</h3>
        {/* Cada columna crece con la cantidad de herramientas: el montón de partículas ya ordenado. */}
        <ul data-fx="cols" className="grid grid-cols-2 items-end md:grid-cols-4 xl:grid-cols-8">
          {l.groups.map((g) => (
            <li
              key={g.name}
              data-skill-col
              className="flex flex-col border-t-4 border-l border-acid border-l-line p-3 sm:p-4 xl:min-h-[var(--h)]"
              style={{ ["--h" as string]: `${5.5 + g.tools.length * 2.4}rem` }}
            >
              <h4 className="display mb-4 text-[clamp(1.5rem,5vw,2rem)] leading-none xl:text-[clamp(1.1rem,1.45vw,1.6rem)]">
                {g.name}
              </h4>
              <ul className="space-y-1 text-[0.8125rem] leading-snug text-fg2">
                {g.tools.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
