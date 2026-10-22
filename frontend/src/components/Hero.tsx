"use client";

import { useLocale } from "@/lib/locale";

export function Hero() {
  const { t } = useLocale();
  const h = t.hero;

  return (
    <section
      id="ruido"
      data-section="ruido"
      aria-labelledby="hero-name"
      className="relative flex min-h-svh flex-col justify-end overflow-hidden pt-24 pb-10 sm:pb-14"
    >
      <div className="container-x flex flex-1 flex-col justify-between gap-12">
        <div className="max-w-xl self-end pt-6 text-right text-sm text-fg2 sm:pt-10">
          <p>{h.stack}</p>
          <p className="mt-1 text-mute">{h.place}</p>
        </div>

        <div>
          <h1
            id="hero-name"
            className="display whitespace-nowrap text-[clamp(4.25rem,20.4vw,30rem)] leading-[0.82]"
          >
            {h.name}
          </h1>

          <div className="mt-8 grid gap-8 border-t border-line pt-6 sm:mt-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
            <p className="max-w-[26ch] text-xl leading-snug text-fg sm:text-2xl">{h.subtitle}</p>

            <div>
              <p className="mb-2 text-xs text-mute">{h.logLabel}</p>
              <ul className="space-y-1 text-sm text-fg2" aria-label={h.logLabel}>
                {h.log.map((line, i) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-acid" aria-hidden="true">
                      &gt;
                    </span>
                    <span>{line}</span>
                    {i === h.log.length - 1 && (
                      <span aria-hidden="true" className="text-acid">
                        _
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
