"use client";

import { useLocale } from "@/lib/locale";

export function Limpieza() {
  const { t } = useLocale();
  const l = t.limpieza;

  return (
    <section
      id="limpieza"
      data-section="limpieza"
      aria-labelledby="limpieza-title"
      className="border-t border-line py-20 sm:py-32"
    >
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <h2 id="limpieza-title" className="display h-section">
            {l.title}
          </h2>
          <div className="max-w-[62ch] space-y-5 pt-2 text-fg2 lg:pt-6">
            {l.bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        <h3 className="mt-20 mb-4 text-xs text-mute sm:mt-28">{l.skillsLabel}</h3>
        {/* Cada columna crece con la cantidad de herramientas: el montón de partículas ya ordenado. */}
        <ul className="grid grid-cols-2 items-end md:grid-cols-4 xl:grid-cols-8">
          {l.groups.map((g) => (
            <li
              key={g.name}
              className="flex flex-col border-t-4 border-l border-acid border-l-line bg-bg p-3 sm:p-4 xl:min-h-[var(--h)]"
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
