"use client";

import { useLocale } from "@/lib/locale";
import { HeroTitle } from "./HeroTitle";
import { TypeLog } from "./TypeLog";
import { Arrow } from "./Arrowed";
import { StaticNoise } from "./StaticNoise";

export function Hero() {
  const { t } = useLocale();
  const h = t.hero;

  return (
    <section
      id="ruido"
      data-section="ruido"
      aria-labelledby="hero-name"
      className="hero-scan relative flex min-h-svh flex-col justify-end overflow-hidden pt-24 pb-10 sm:pb-14"
    >
      <StaticNoise />
      <div className="container-x relative flex flex-1 flex-col justify-between gap-12">
        <div className="max-w-xl self-end pt-6 text-right text-sm text-fg2 sm:pt-10">
          <p>{h.stack}</p>
          <p className="mt-1 text-mute">{h.place}</p>
          <p className="mt-3">
            <a href="#servicios" className="text-fg underline underline-offset-4 hover:text-acid">
              {h.freelance} <Arrow />
            </a>
          </p>
        </div>

        <div>
          <HeroTitle
            text={h.name}
            className="display whitespace-nowrap text-[clamp(3rem,20.4vw,30rem)] leading-[0.82]"
          />

          <div className="mt-8 grid gap-8 border-t border-line pt-6 sm:mt-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
            <p className="max-w-[26ch] text-xl leading-snug text-fg sm:text-2xl">{h.subtitle}</p>

            <div>
              <p className="mb-2 text-xs text-mute">{h.logLabel}</p>
              <TypeLog lines={h.log} label={h.logLabel} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
