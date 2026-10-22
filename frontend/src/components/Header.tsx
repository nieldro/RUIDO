"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useLocale } from "@/lib/locale";
import { scrollState } from "@/lib/scrollState";

export function Header() {
  const { locale, setLocale, t } = useLocale();
  const valueRef = useRef<HTMLSpanElement>(null);
  const srRef = useRef<HTMLSpanElement>(null);
  const [onPaper, setOnPaper] = useState(false);

  // El indicador lee el estado de scroll en cada tick y escribe el DOM directo: cero renders de React.
  useEffect(() => {
    let last = -1;
    let paper = false;
    const tick = () => {
      const n = Math.round(scrollState.noise);
      if (n !== last) {
        last = n;
        if (valueRef.current) valueRef.current.textContent = String(n).padStart(3, " ");
        if (srRef.current) srRef.current.textContent = `${n}%`;
      }
      if (scrollState.onPaper !== paper) {
        paper = scrollState.onPaper;
        setOnPaper(paper);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  const tone = `transition-colors duration-200 ease-out ${
    onPaper ? "text-ink border-line-ink bg-paper" : "text-fg border-line bg-bg"
  }`;
  const muted = onPaper ? "text-mute-ink" : "text-mute";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b pt-[env(safe-area-inset-top)] ${tone}`}>
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
              {t.nav.noiseAria}: <span ref={srRef}>100%</span>
            </span>
            <span aria-hidden="true">
              [ {t.nav.noise}{" "}
              <span className={onPaper ? "text-ink" : "text-acid"}>
                <span ref={valueRef}>100</span>%
              </span>{" "}
              ]
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
                className={`min-h-8 min-w-8 px-1.5 uppercase transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.96] ${
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
