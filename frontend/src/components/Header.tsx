"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale";

// Nivel de ruido por sección. En la maqueta salta de golpe; la animación lo interpolará con el scroll.
export const SECTION_NOISE: Record<string, number> = {
  ruido: 100,
  limpieza: 62,
  historial: 45,
  modelo: 30,
  archivo: 20,
  pipeline: 8,
  servicios: 4,
  senal: 0,
};

export function Header() {
  const { locale, setLocale, t } = useLocale();
  const [noise, setNoise] = useState(100);
  const [onPaper, setOnPaper] = useState(false);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = (e.target as HTMLElement).dataset.section ?? "";
          if (id in SECTION_NOISE) {
            setNoise(SECTION_NOISE[id]);
            setOnPaper(id === "senal");
          }
        }
      },
      // Línea de lectura: el tercio superior de la ventana.
      { rootMargin: "-10% 0px -80% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const tone = onPaper ? "text-ink border-line-ink bg-paper" : "text-fg border-line bg-bg";
  const muted = onPaper ? "text-mute-ink" : "text-mute";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b ${tone}`}>
      <a
        href="#contenido"
        className="sr-only-focusable fixed top-2 left-2 z-[60] bg-acid px-3 py-2 font-bold text-bg"
      >
        {t.nav.skip}
      </a>
      <div className="container-x flex h-12 items-center justify-between gap-4 text-xs sm:text-sm">
        <a href="#ruido" className="font-bold tracking-wider no-underline">
          {t.nav.logo}
        </a>

        <div className="flex items-center gap-4 sm:gap-8">
          <p className="tabular-nums">
            <span className="sr-only">
              {t.nav.noiseAria}: {noise}%
            </span>
            <span aria-hidden="true">
              [ {t.nav.noise} <span className={onPaper ? "text-ink" : "text-acid"}>{String(noise).padStart(3, " ")}%</span> ]
            </span>
          </p>

          <div role="group" aria-label={t.nav.langLabel} className="flex items-center gap-1">
            {(["es", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                aria-pressed={locale === l}
                onClick={() => setLocale(l)}
                className={`min-h-8 min-w-8 px-1.5 uppercase ${
                  locale === l
                    ? onPaper
                      ? "bg-ink text-paper"
                      : "bg-acid text-bg"
                    : `${muted} hover:text-current`
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
